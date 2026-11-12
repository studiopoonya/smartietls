<?php

namespace App\Http\Controllers;

use App\Models\AiCache;
use App\Models\CurriculumDrill;
use App\Models\CurriculumLesson;
use App\Models\DrillAttempt;
use App\Services\ClaudeService;
use App\Services\CurriculumProgress;
use App\Services\DrillEngine;
use App\Services\Prompts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CurriculumController extends Controller
{
    public function __construct(
        private CurriculumProgress $progress,
        private DrillEngine $engine,
        private ClaudeService $claude,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->progress->snapshot($request->user()));
    }

    public function lesson(Request $request, string $slug): JsonResponse
    {
        $lesson = CurriculumLesson::where('slug', $slug)->with(['drills', 'module'])->firstOrFail();

        if ($reason = $this->progress->lessonLockReason($request->user(), $lesson)) {
            return $this->locked($reason);
        }

        $attempts = DrillAttempt::where('user_id', $request->user()->id)
            ->whereIn('drill_id', $lesson->drills->pluck('id'))
            ->whereNotNull('submitted_at')
            ->orderBy('id')
            ->get();

        // A drill stays passed after a later failed retry, matching how lesson completion is counted.
        $passedDrillIds = $attempts->where('passed', true)->pluck('drill_id')->flip();
        $latestAttempts = $attempts->keyBy('drill_id');

        return response()->json([
            'slug'        => $lesson->slug,
            'title'       => $lesson->title,
            'description' => $lesson->description,
            'duration'    => $lesson->duration_minutes,
            'content'     => $lesson->content,
            'module'      => $lesson->module->only(['slug', 'title', 'skill', 'phase']),
            'drills'      => $lesson->drills->map(fn ($d) => [
                'slug'         => $d->slug,
                'type'         => $d->type,
                'evaluator'    => $d->evaluator,
                'title'        => $d->title,
                'instructions' => $d->instructions,
                'payload'      => $d->payload,
                'passed'       => $passedDrillIds->has($d->id),
                'lastScore'    => $latestAttempts[$d->id]->score ?? null,
            ]),
        ]);
    }

    /** A Bahasa Indonesia explanation of a lesson. It is written once per lesson version and shared by every learner. */
    public function lessonInBahasa(Request $request, string $slug): JsonResponse
    {
        $lesson = CurriculumLesson::where('slug', $slug)->with('module')->firstOrFail();
        $user = $request->user();

        if ($reason = $this->progress->lessonLockReason($user, $lesson)) {
            return $this->locked($reason);
        }

        $key = $slug . ':' . sha1(json_encode($lesson->content));
        if ($cached = AiCache::getCached('lesson_bahasa', $key)) {
            return response()->json($cached);
        }

        $apiKey = $user->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        $sections = collect($lesson->content['theory'] ?? [])->map(fn ($s) => "## {$s['heading']}\n{$s['body']}\nTips: " . implode('; ', $s['tips'] ?? []))->implode("\n\n");
        $takeaways = implode('; ', $lesson->content['keyTakeaways'] ?? []);
        $message = "<lesson>\nTitle: {$lesson->title}\nDescription: {$lesson->description}\n\n{$sections}\n\nKey takeaways: {$takeaways}\n</lesson>";

        try {
            $result = $this->claude->getJson($apiKey, Prompts::LESSON_EXPLAINER_ID, $message, 2500);
        } catch (\Exception $e) {
            Log::error('Lesson explanation error: ' . $e->getMessage());
            return response()->json(['message' => 'The explanation could not be written. Please try again.'], 500);
        }

        $clean = [
            'summary'   => is_string($result['summary'] ?? null) ? $result['summary'] : '',
            'points'    => collect(is_array($result['points'] ?? null) ? $result['points'] : [])
                ->filter(fn ($p) => is_array($p) && is_string($p['heading'] ?? null) && is_string($p['body'] ?? null))
                ->map(fn ($p) => ['heading' => $p['heading'], 'body' => $p['body']])->values()->all(),
            'takeaways' => array_values(array_filter(is_array($result['takeaways'] ?? null) ? $result['takeaways'] : [], 'is_string')),
        ];

        if ($clean['summary'] === '' && $clean['points'] === []) {
            return response()->json(['message' => 'The explanation could not be written. Please try again.'], 500);
        }

        AiCache::putCache('lesson_bahasa', $key, $clean, 1);

        return response()->json($clean);
    }

    public function startDrill(Request $request, string $slug): JsonResponse
    {
        return $this->guarded($request, $slug, ['timed_passage', 'adaptive_quiz'], function ($drill, $apiKey) use ($request) {
            return $this->engine->start($request->user(), $drill, $apiKey);
        });
    }

    public function nextBlock(Request $request, string $slug): JsonResponse
    {
        $data = $request->validate(['responses' => 'present|array', 'blockIndex' => 'required|integer|min:0']);

        return $this->guarded($request, $slug, ['adaptive_quiz'], function ($drill, $apiKey) use ($request, $data) {
            return $this->engine->nextBlock($request->user(), $drill, $data['responses'], (int) $data['blockIndex'], $apiKey);
        });
    }

    public function submitDrill(Request $request, string $slug): JsonResponse
    {
        $drill = CurriculumDrill::where('slug', $slug)->with('lesson.module')->firstOrFail();
        $user = $request->user();

        if ($reason = $this->progress->lessonLockReason($user, $drill->lesson)) {
            return $this->locked($reason);
        }

        if (in_array($drill->type, ['quiz', 'timed_passage'], true)) {
            $data = $request->validate(['responses' => 'present|array']);

            return response()->json($drill->type === 'quiz'
                ? $this->engine->submitQuiz($user, $drill, $data['responses'], $drill->answer_key['questions'])
                : $this->engine->submitPassage($user, $drill, $data['responses']));
        }

        abort_unless(in_array($drill->type, ['ai_writing', 'ai_speaking'], true), 422, 'This drill is submitted block by block.');

        $data = $request->validate(['text' => 'required|string|max:8000']);
        $minWords = $drill->payload['minWords'] ?? 5;

        // Counted by whitespace so figures such as "2020" count as words, matching the word counter in the UI.
        if (count(preg_split('/\s+/', trim($data['text']))) < $minWords) {
            return response()->json(['message' => "Please write at least {$minWords} words."], 422);
        }

        return $this->guarded($request, $slug, ['ai_writing', 'ai_speaking'], function ($drill, $apiKey) use ($user, $data) {
            return $this->engine->submitAi($user, $drill, $data['text'], $apiKey);
        }, lockChecked: true);
    }

    private function guarded(Request $request, string $slug, array $types, callable $action, bool $lockChecked = false): JsonResponse
    {
        $drill = CurriculumDrill::where('slug', $slug)->with('lesson.module')->firstOrFail();
        $user = $request->user();

        abort_unless(in_array($drill->type, $types, true), 422, 'This action is not available for this drill.');

        if (!$lockChecked && ($reason = $this->progress->lessonLockReason($user, $drill->lesson))) {
            return $this->locked($reason);
        }

        $apiKey = $user->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        try {
            return response()->json($action($drill, $apiKey));
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Drill error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function locked(string $reason): JsonResponse
    {
        return response()->json(['message' => 'This lesson is locked.', 'lockReason' => $reason], 423);
    }
}
