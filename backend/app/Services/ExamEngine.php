<?php

namespace App\Services;

use App\Models\AiCache;
use App\Models\ErrorLogEntry;
use App\Models\ExamSimulation;
use App\Models\LearningSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Phase 4: Listening > Reading > Writing with no break, then the Score Readiness Report. */
class ExamEngine
{
    public const STAGE_SECONDS = ['listening' => 1800, 'reading' => 3600, 'writing' => 3600];
    private const UNITS = [['listening', 1], ['listening', 2], ['listening', 3], ['listening', 4], ['reading', 1], ['reading', 2], ['reading', 3], ['writing', 1]];
    private const READING_QUESTIONS = [1 => 13, 2 => 13, 3 => 14];
    private const AI_POOL = 8;
    private const GRACE_SECONDS = 90;
    private const FINALIZE_CLAIM_MINUTES = 10;

    public const ACTIVE_STATUSES = ['preparing', 'in_progress', 'evaluating', 'finalizing'];

    public function __construct(
        private ClaudeService $claude,
        private ErrorBank $errors,
        private StudyActivity $activity,
        private CurriculumProgress $progress,
    ) {}

    /** Generates one paper unit per call, so progress can be shown and no request runs too long. */
    public function prepareNext(ExamSimulation $exam, string $apiKey): void
    {
        $content = $exam->content ?? ['listening' => [], 'reading' => [], 'writing' => []];
        $next = self::UNITS[$this->preparedCount($content)] ?? null;

        if ($next) {
            [$stage, $number] = $next;
            $content[$stage][] = $this->generateUnit($stage, $number, $apiKey);
            $exam->content = $content;
        }

        if ($this->preparedCount($content) === count(self::UNITS)) {
            $exam->status = 'in_progress';
            $exam->stage = 'listening';
            $exam->stage_started_at = now();
        }

        $exam->save();
    }

    /** The server owns the clock: a section past its limit closes with whatever was last saved. */
    public function syncDeadline(ExamSimulation $exam): void
    {
        $changed = false;

        while ($exam->status === 'in_progress') {
            $end = $exam->stage_started_at->copy()->addSeconds(self::STAGE_SECONDS[$exam->stage]);
            if (now()->lte($end->copy()->addSeconds(self::GRACE_SECONDS))) break;

            // The next section began when this one ended, because the exam has no breaks.
            $this->advanceStage($exam, $end);
            $changed = true;
        }

        if ($changed) $exam->save();
    }

    public function saveProgress(ExamSimulation $exam, string $stage, array $responses): bool
    {
        $this->syncDeadline($exam);

        if ($exam->status !== 'in_progress' || $exam->stage !== $stage) return false;

        $exam->responses = array_merge($exam->responses ?? [], [$stage => $responses]);
        $exam->save();

        return true;
    }

    public function submitStage(ExamSimulation $exam, string $stage, array $responses): void
    {
        $this->syncDeadline($exam);

        // A repeated submit from a double click or a retry must not skip the following stage.
        if ($exam->status !== 'in_progress' || $exam->stage !== $stage) return;

        $exam->responses = array_merge($exam->responses ?? [], [$stage => $responses]);
        $this->advanceStage($exam, now());
        $exam->save();
    }

    public function abandon(ExamSimulation $exam): void
    {
        if (in_array($exam->status, ['preparing', 'in_progress', 'evaluating'], true)) {
            $exam->update(['status' => 'abandoned', 'stage' => null, 'stage_started_at' => null]);
        }
    }

    private function advanceStage(ExamSimulation $exam, $nextStart): void
    {
        if ($exam->stage === 'writing') {
            $exam->status = 'evaluating';
            $exam->stage = null;
            $exam->stage_started_at = null;
            return;
        }

        $exam->stage = $exam->stage === 'listening' ? 'reading' : 'writing';
        $exam->stage_started_at = $nextStart;
    }

    /** Only one request may mark a paper. A claim left behind by a crashed request expires. */
    private function claimFinalization(ExamSimulation $exam): bool
    {
        $claimed = ExamSimulation::whereKey($exam->id)
            ->where(fn ($q) => $q->where('status', 'evaluating')->orWhere(
                fn ($q) => $q->where('status', 'finalizing')->where('updated_at', '<', now()->subMinutes(self::FINALIZE_CLAIM_MINUTES))
            ))
            ->update(['status' => 'finalizing']);

        $exam->refresh();

        return $claimed === 1;
    }

    public function finalize(User $user, ExamSimulation $exam, string $apiKey): void
    {
        if (!$this->claimFinalization($exam)) return;

        try {
            $this->markPaper($user, $exam, $apiKey);
        } catch (\Throwable $e) {
            $exam->update(['status' => 'evaluating']);
            throw $e;
        }
    }

    private function markPaper(User $user, ExamSimulation $exam, string $apiKey): void
    {
        $scores = $exam->scores ?? [];

        foreach (['listening', 'reading'] as $skill) {
            $scores[$skill] ??= $this->scoreObjective($exam, $skill);
        }

        // Each essay is one Claude call. After a call the claim is released and the step saved, so a
        // single request never runs long enough to hit a proxy or PHP-FPM timeout; the page calls again.
        if (!isset($scores['writing'])) {
            $parts = $scores['writingParts'] ?? [];
            foreach (['task1', 'task2'] as $task) {
                if (isset($parts[$task])) continue;
                [$parts[$task], $calledClaude] = $this->markEssay($user, $exam, $task, $apiKey);
                $scores['writingParts'] = $parts;
                if ($calledClaude) {
                    $exam->update(['scores' => $scores, 'status' => 'evaluating']);
                    return;
                }
            }

            $scores['writing'] = ['band' => BandScale::roundHalf(($parts['task1']['band'] + 2 * $parts['task2']['band']) / 3)] + $parts;
            unset($scores['writingParts']);
            $exam->update(['scores' => $scores]);
        }

        $speaking = $user->progressSnapshots()->latest('id')->whereNotNull('speaking_band')->first()?->speaking_band;
        $bands = array_filter([$scores['listening']['band'], $scores['reading']['band'], $scores['writing']['band'], $speaking], fn ($b) => $b !== null);
        $overall = BandScale::roundHalf(array_sum($bands) / count($bands));

        $recent = ExamSimulation::where('user_id', $user->id)
            ->where('status', 'completed')
            ->where('id', '!=', $exam->id)
            ->latest('id')
            ->limit(2)
            ->pluck('overall_band')
            ->push($overall);

        $stablePrediction = BandScale::roundHalf($recent->avg());
        $isStable = $recent->count() >= 2 && $recent->max() - $recent->min() <= 0.5;
        $target = (float) ($user->target_band ?? 7);
        $skillChecks = $this->skillChecks($user, [
            'listening' => $scores['listening']['band'],
            'reading'   => $scores['reading']['band'],
            'writing'   => $scores['writing']['band'],
            'speaking'  => $speaking,
        ]);
        $verdict = self::readinessVerdict($stablePrediction, $isStable, $target, $skillChecks);

        $topErrors = ErrorLogEntry::where('user_id', $user->id)
            ->where('status', 'quarantined')
            ->selectRaw('category, count(*) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        $narrative = $this->claude->getJson($apiKey, Prompts::forLearner(Prompts::READINESS_REPORT, $user), json_encode([
            'targetBand'          => $target,
            'listeningBand'       => $scores['listening']['band'],
            'readingBand'         => $scores['reading']['band'],
            'writingBand'         => $scores['writing']['band'],
            'speakingBandFromCourseWork' => $speaking,
            'overallBand'         => $overall,
            'stablePrediction'    => $stablePrediction,
            'predictionIsStable'  => $isStable,
            'verdict'             => $verdict,
            'perSkillMinimumChecks' => $skillChecks,
            'unresolvedErrors'    => $topErrors,
            'diagnosticBaseline'  => $this->progress->snapshot($user)['baseline']['bands'],
        ]), 1500);

        DB::transaction(function () use ($user, $exam, $scores, $speaking, $overall, $narrative, $target, $stablePrediction, $isStable, $verdict, $recent, $skillChecks) {
            $exam->update([
                'status'       => 'completed',
                'scores'       => $scores + ['speakingEstimate' => $speaking !== null ? (float) $speaking : null],
                'overall_band' => $overall,
                'report'       => $narrative + [
                    'targetBand'       => $target,
                    'stablePrediction' => $stablePrediction,
                    'isStable'         => $isStable,
                    'verdict'          => $verdict,
                    'skillChecks'      => $skillChecks,
                    'simulationsUsed'  => $recent->count(),
                ],
            ]);

            LearningSession::create([
                'user_id'     => $user->id,
                'module'      => 'mock_test',
                'input_data'  => ['exam_simulation_id' => $exam->id],
                'ai_feedback' => $exam->report,
                'band_score'  => $overall,
            ]);

            $this->activity->recordBands($user, [
                'listening' => (float) $scores['listening']['band'],
                'reading'   => (float) $scores['reading']['band'],
                'writing'   => (float) $scores['writing']['band'],
            ]);

            $this->activity->touchStreak($user);
        });
    }

    /** One entry for each skill the learner set a minimum on. A skill with no band yet counts as not met. */
    private function skillChecks(User $user, array $bands): array
    {
        $checks = [];

        foreach ($user->skill_minimums ?? [] as $skill => $required) {
            if ($required === null || !array_key_exists($skill, $bands)) continue;

            $band = $bands[$skill] !== null ? (float) $bands[$skill] : null;
            $checks[] = ['skill' => $skill, 'band' => $band, 'required' => (float) $required, 'met' => $band !== null && $band >= (float) $required];
        }

        return $checks;
    }

    /** A strong overall cannot hide a skill below its minimum: any missed minimum rules out "ready". */
    public static function readinessVerdict(float $prediction, bool $isStable, float $target, array $skillChecks): string
    {
        $missed = array_filter($skillChecks, fn ($check) => !$check['met']);
        $gaps = array_map(fn ($check) => $check['band'] === null ? 0.5 : $check['required'] - $check['band'], $missed);
        $largestGap = max([0.0, ...array_values($gaps)]);

        if ($prediction < $target - 0.5 || $largestGap > 0.5) return 'not_ready';

        return $prediction >= $target && $isStable && $missed === [] ? 'ready' : 'almost';
    }

    public function publicState(ExamSimulation $exam): array
    {
        $state = [
            'id'         => $exam->id,
            'status'     => $exam->status,
            'stage'      => $exam->stage,
            'prepared'   => $this->preparedCount($exam->content ?? []),
            'totalUnits' => count(self::UNITS),
        ];

        if ($exam->status === 'in_progress') {
            $elapsed = (int) $exam->stage_started_at->diffInSeconds(now(), true);
            $state['remainingSeconds'] = max(0, self::STAGE_SECONDS[$exam->stage] - $elapsed);
            $state['savedResponses'] = $exam->responses[$exam->stage] ?? [];
            $state['content'] = array_map(function (array $unit) {
                unset($unit['answers']);
                return $unit;
            }, $exam->content[$exam->stage]);
        }

        if ($exam->status === 'completed') {
            $state['scores'] = $exam->scores;
            $state['overallBand'] = $exam->overall_band;
            $state['report'] = $exam->report;
        }

        return $state;
    }

    private function preparedCount(array $content): int
    {
        return count($content['listening'] ?? []) + count($content['reading'] ?? []) + count($content['writing'] ?? []);
    }

    private function generateUnit(string $stage, int $number, string $apiKey): array
    {
        [$prompt, $message, $tokens] = match ($stage) {
            'listening' => [Prompts::LISTENING_GENERATOR, "Generate an IELTS Listening Section {$number} exercise with exactly 10 questions. For mcq questions the answer must be only the option letter.", 4000],
            'reading'   => [Prompts::TIMED_READING_GENERATOR, 'Generate a passage with exactly ' . self::READING_QUESTIONS[$number] . ' questions at Band 7 difficulty, matching the difficulty of IELTS Academic passage ' . $number . ' of 3.', 5000],
            'writing'   => [Prompts::EXAM_WRITING_GENERATOR, 'Generate a Writing paper.', 1500],
        };

        $type = "exam_{$stage}";
        $key = "unit:{$number}";

        if (AiCache::where('type', $type)->where('cache_key', $key)->count() >= self::AI_POOL) {
            return AiCache::getCached($type, $key);
        }

        $generated = $this->claude->getJson($apiKey, $prompt, $message, $tokens);

        match ($stage) {
            'listening' => GeneratedContent::assertQuestionUnit($generated, 'transcript', 8),
            'reading'   => GeneratedContent::assertQuestionUnit($generated, 'passage', self::READING_QUESTIONS[$number] - 1),
            'writing'   => GeneratedContent::assertWritingPaper($generated),
        };

        AiCache::putCache($type, $key, $generated, self::AI_POOL);

        return $generated;
    }

    private function scoreObjective(ExamSimulation $exam, string $skill): array
    {
        $responses = $exam->responses[$skill] ?? [];
        $correct = 0;
        $total = 0;

        foreach ($exam->content[$skill] as $unitIndex => $unit) {
            foreach ($unit['questions'] as $question) {
                $total++;
                $given = (string) ($responses["{$unitIndex}-{$question['id']}"] ?? '');
                $correct += DrillEngine::matches($given, (string) ($unit['answers'][$question['id']] ?? '')) ? 1 : 0;
            }
        }

        $raw = $total ? (int) round($correct / $total * 40) : 0;

        return ['correct' => $correct, 'total' => $total, 'band' => BandScale::fromRaw($skill, $raw)];
    }

    /** @return array{0: array, 1: bool} the task result, and whether Claude was called for it */
    private function markEssay(User $user, ExamSimulation $exam, string $task, string $apiKey): array
    {
        $paper = $exam->content['writing'][0];
        $essay = (string) (($exam->responses['writing'] ?? [])[$task] ?? '');
        $prompt = $task === 'task1'
            ? $paper['task1']['prompt'] . "\nData: " . json_encode($paper['task1']['table'] ?? [])
            : $paper['task2']['prompt'];

        if (str_word_count($essay) < 20) {
            return [['band' => 0.0, 'feedback' => 'Not enough writing was submitted to assess this task.'], false];
        }

        $result = $this->claude->getJson($apiKey, Prompts::forLearner(Prompts::WRITING_EVALUATOR, $user), "Task Type: IELTS Writing {$task}\nPrompt: {$prompt}\n\nEssay:\n{$essay}", 3000);

        ErrorBank::safely(fn () => $this->errors->captureEssay($user, $result));

        $improvements = $result['highlights']['improvements'] ?? [];

        return [[
            'band'         => (float) ($result['overallBand'] ?? 0),
            'feedback'     => is_string($result['criteria']['taskAchievement']['feedback'] ?? null) ? $result['criteria']['taskAchievement']['feedback'] : '',
            'improvements' => is_array($improvements) ? array_values(array_filter($improvements, 'is_string')) : [],
        ], true];
    }
}
