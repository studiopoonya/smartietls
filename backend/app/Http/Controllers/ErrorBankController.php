<?php

namespace App\Http\Controllers;

use App\Models\CurriculumLesson;
use App\Models\ErrorLogEntry;
use App\Models\RewriteChallenge;
use App\Models\User;
use App\Services\ClaudeService;
use App\Services\CurriculumProgress;
use App\Services\ErrorBank;
use App\Services\Prompts;
use App\Services\StudyActivity;
use App\Services\Weakness;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ErrorBankController extends Controller
{
    public function __construct(
        private ErrorBank $bank,
        private ClaudeService $claude,
        private StudyActivity $activity,
        private CurriculumProgress $progress,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $entries = ErrorLogEntry::where('user_id', $user->id);
        $pending = RewriteChallenge::where('user_id', $user->id)->where('status', 'pending')->with('module:id,title')->first();

        return response()->json([
            'daily' => $this->bank->dailyList($user)->map(fn ($e) => [
                'id'       => $e->id,
                'skill'    => $e->skill,
                'category' => $e->category,
                'original' => $e->original,
            ])->values(),
            'stats' => [
                'quarantined' => (clone $entries)->where('status', 'quarantined')->count(),
                'cleared'     => (clone $entries)->where('status', 'cleared')->count(),
                'logged'      => (clone $entries)->where('status', 'logged')->count(),
            ],
            'weaknesses' => $this->weaknesses($user),
            'practiceSetsLeft' => WeaknessController::setsLeft($user),
            'log' => (clone $entries)->latest('updated_at')->limit(50)
                ->get(['id', 'skill', 'category', 'weakness', 'original', 'correction', 'explanation', 'status', 'occurrences', 'next_review_at'])
                ->map(fn ($e) => [
                    'id'          => $e->id,
                    'skill'       => $e->skill,
                    'category'    => $e->category,
                    'weakness'    => $e->weakness,
                    'original'    => $e->original,
                    'correction'  => ErrorBank::isDue($e) ? null : $e->correction,
                    'explanation' => ErrorBank::isDue($e) ? null : $e->explanation,
                    'status'      => $e->status,
                    'occurrences' => $e->occurrences,
                    'hidden'      => ErrorBank::isDue($e),
                ]),
            'rewrite' => $pending ? [
                'id'                => $pending->id,
                'moduleTitle'       => $pending->module->title,
                'originalParagraph' => $pending->original_paragraph,
                'originalBand'      => $pending->original_band,
                'revisionAdvice'    => $pending->revision_advice,
                'feedback'          => $pending->feedback,
            ] : null,
        ]);
    }

    /** Weakness groups, each with the lesson that teaches the fix when one exists. */
    private function weaknesses(User $user): array
    {
        $groups = $this->bank->weaknessGroups($user);
        $slugs = array_filter(array_map(fn ($g) => Weakness::fixLessonSlug($g['skill'], $g['weakness']), $groups));
        $lessons = CurriculumLesson::whereIn('slug', $slugs)->with('module')->get()->keyBy('slug');
        $locks = $lessons->isEmpty() ? [] : $this->progress->lockReasons($user);

        return array_map(function ($group) use ($lessons, $locks) {
            $lesson = $lessons[Weakness::fixLessonSlug($group['skill'], $group['weakness'])] ?? null;
            return $group + [
                'lesson' => $lesson ? [
                    'slug'   => $lesson->slug,
                    'title'  => $lesson->title,
                    'skill'  => $lesson->module->skill,
                    // An unlocked lesson maps to null, so ?? would wrongly treat it as locked.
                    'locked' => !array_key_exists($lesson->slug, $locks) || $locks[$lesson->slug] !== null,
                ] : null,
            ];
        }, $groups);
    }

    public function practice(Request $request, ErrorLogEntry $entry): JsonResponse
    {
        abort_unless($entry->user_id === $request->user()->id, 403);
        abort_unless($entry->status === 'quarantined' && !$entry->next_review_at?->isFuture(), 422, 'This item is not due for practice yet.');

        $data = $request->validate(['answer' => 'required|string|max:2000']);
        $correct = $this->bank->practice($entry, $data['answer']);
        $this->activity->touchStreak($request->user());

        return response()->json([
            'correct'     => $correct,
            'correction'  => $entry->correction,
            'explanation' => $entry->explanation,
            'status'      => $entry->status,
        ]);
    }

    public function submitRewrite(Request $request, RewriteChallenge $challenge): JsonResponse
    {
        $user = $request->user();
        abort_unless($challenge->user_id === $user->id, 403);
        abort_unless($challenge->status === 'pending', 422, 'This challenge is already complete.');

        $data = $request->validate(['rewritten' => 'required|string|min:20|max:4000']);

        $apiKey = $user->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        $message = "Revision advice: {$challenge->revision_advice}\nOriginal band: {$challenge->original_band}\n\n<original>\n{$challenge->original_paragraph}\n</original>\n\n<rewritten>\n{$data['rewritten']}\n</rewritten>";

        try {
            $result = $this->claude->getJson($apiKey, Prompts::forLearner(Prompts::REWRITE_EVALUATOR, $user), $message, 800);
        } catch (\Exception $e) {
            Log::error('Rewrite challenge error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }

        $improved = !empty($result['improved']);

        $challenge->update([
            'rewritten'      => $data['rewritten'],
            'rewritten_band' => $result['band'] ?? null,
            'feedback'       => $result['feedback'] ?? null,
            'status'         => $improved ? 'completed' : 'pending',
        ]);

        $this->activity->touchStreak($user);

        return response()->json(['completed' => $improved, 'band' => $result['band'] ?? null, 'feedback' => $result['feedback'] ?? '']);
    }
}
