<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WeaknessDrill;
use App\Services\ClaudeService;
use App\Services\DrillEngine;
use App\Services\ErrorBank;
use App\Services\GeneratedContent;
use App\Services\Prompts;
use App\Services\StudyActivity;
use App\Services\Weakness;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/** "Fix This Weakness": short practice sets generated from the learner's own logged mistakes. */
class WeaknessController extends Controller
{
    public const DAILY_SETS = 5;
    private const QUESTIONS = 5;

    public function __construct(
        private ClaudeService $claude,
        private ErrorBank $bank,
        private DrillEngine $engine,
        private StudyActivity $activity,
    ) {}

    /** The one place the daily quota is counted, so the Error Bank page and this endpoint always agree. */
    public static function setsLeft(User $user): int
    {
        $used = WeaknessDrill::where('user_id', $user->id)->where('created_at', '>=', now()->startOfDay())->count();
        return max(0, self::DAILY_SETS - $used);
    }

    public function start(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'skill'    => 'required|in:reading,listening,writing,speaking',
            'weakness' => 'required|string|max:40',
        ]);
        abort_unless(array_key_exists($data['weakness'], Weakness::tagsFor($data['skill'])), 422, 'Unknown weakness.');

        // A reload or double tap reopens the unfinished set instead of paying for a new one.
        $open = WeaknessDrill::where('user_id', $user->id)
            ->where('skill', $data['skill'])
            ->where('weakness', $data['weakness'])
            ->whereNull('submitted_at')
            ->where('created_at', '>=', now()->subDay())
            ->latest('id')
            ->first();

        if ($open) return response()->json($this->present($open));

        if (self::setsLeft($user) === 0) {
            return response()->json(['message' => 'You have used today\'s ' . self::DAILY_SETS . ' practice sets. New sets unlock tomorrow.'], 429);
        }

        $apiKey = $user->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        $mistakes = $this->bank->examples($user, $data['skill'], $data['weakness'])
            ->map(fn ($e) => "- Learner wrote: {$e->original}\n  Correct: {$e->correction}")
            ->implode("\n");

        $label = Weakness::label($data['skill'], $data['weakness']);
        $message = "Skill: {$data['skill']}\nWeakness: {$label}\n\n<learner_mistakes>\n" . ($mistakes ?: '(none logged yet: use typical IELTS mistakes for this weakness)') . "\n</learner_mistakes>";

        try {
            $content = $this->claude->getJson($apiKey, Prompts::forLearner(Prompts::WEAKNESS_DRILL_GENERATOR, $user), $message, 3000);
            $needsText = in_array($data['skill'], ['reading', 'listening'], true);
            if (!$needsText) $content['text'] ??= '-';
            GeneratedContent::assertQuestionUnit($content, 'text', self::QUESTIONS - 1);
            if (!$needsText) $content['text'] = null;
        } catch (\Exception $e) {
            Log::error('Weakness drill error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }

        $drill = WeaknessDrill::create([
            'user_id'  => $user->id,
            'skill'    => $data['skill'],
            'weakness' => $data['weakness'],
            'content'  => $content,
        ]);

        return response()->json($this->present($drill));
    }

    public function submit(Request $request, WeaknessDrill $drill): JsonResponse
    {
        abort_unless($drill->user_id === $request->user()->id, 403);
        abort_if($drill->submitted_at !== null, 422, 'This practice set is already checked.');

        $data = $request->validate(['responses' => 'present|array']);
        $content = $drill->content;

        $key = [];
        foreach ($content['answers'] as $id => $answer) {
            $key[(string) $id] = ['answer' => (string) $answer, 'explain' => $content['explanations'][$id] ?? null];
        }
        $graded = $this->engine->grade($content['questions'], $key, $data['responses']);

        $drill->update([
            'responses'    => $data['responses'],
            'correct'      => $graded['correct'],
            'total'        => $graded['total'],
            'submitted_at' => now(),
        ]);

        $this->activity->touchStreak($request->user());

        return response()->json(['correct' => $graded['correct'], 'total' => $graded['total'], 'results' => $graded['results'], 'text' => $content['text'] ?? null]);
    }

    private function present(WeaknessDrill $drill): array
    {
        $content = $drill->content;

        return [
            'id'        => $drill->id,
            'skill'     => $drill->skill,
            'weakness'  => $drill->weakness,
            'label'     => Weakness::label($drill->skill, $drill->weakness),
            'title'     => $content['title'] ?? 'Targeted practice',
            'tip'       => $content['tip'] ?? null,
            'text'      => $content['text'] ?? null,
            'questions' => $content['questions'],
        ];
    }
}
