<?php

namespace App\Services;

use App\Models\AiCache;
use App\Models\CurriculumDrill;
use App\Models\DiagnosticResult;
use App\Models\DrillAttempt;
use App\Models\User;

/** Evaluation triggers for every drill type: answer key checks and Claude calls. */
class DrillEngine
{
    public const PASS_PERCENT = 70;
    private const BLOCKS = 3;
    private const START_BAND = 6;
    private const MIN_BAND = 4;
    private const MAX_BAND = 8;
    private const AI_POOL = 6;
    private const MIN_PASSAGE_BAND = 5;
    private const MAX_PASSAGE_BAND = 8;
    private const GRACE_SECONDS = 90;

    public function __construct(
        private ClaudeService $claude,
        private ErrorBank $errors,
        private StudyActivity $activity,
        private CurriculumProgress $progress,
    ) {}

    private function findOpenAttempt(User $user, CurriculumDrill $drill): ?DrillAttempt
    {
        return DrillAttempt::where('user_id', $user->id)
            ->where('drill_id', $drill->id)
            ->whereNull('submitted_at')
            ->latest('id')
            ->first();
    }

    public function openAttempt(User $user, CurriculumDrill $drill): DrillAttempt
    {
        return $this->findOpenAttempt($user, $drill)
            ?? DrillAttempt::create(['user_id' => $user->id, 'drill_id' => $drill->id]);
    }

    public function start(User $user, CurriculumDrill $drill, string $apiKey): array
    {
        $attempt = $this->openAttempt($user, $drill);

        // A passage left open past its limit is closed, so a reload can never restart its clock.
        if ($drill->type === 'timed_passage' && $attempt->generated && $this->isLate($drill, $attempt)) {
            $attempt->fill(['evaluation' => ['expired' => true], 'score' => 0, 'passed' => false, 'submitted_at' => now()])->save();
            $attempt = DrillAttempt::create(['user_id' => $user->id, 'drill_id' => $drill->id]);
        }

        if (!$attempt->generated) {
            $attempt->generated = $drill->type === 'adaptive_quiz'
                ? ['blocks' => [$this->generateBlock($drill, self::START_BAND, 0, $apiKey)]]
                : $this->generatePassage($user, $drill, $apiKey) + ['startedAt' => now()->timestamp];
            $attempt->save();
        }

        if ($drill->type === 'adaptive_quiz') {
            return $this->blockState($attempt->generated['blocks']);
        }

        return [
            'content'          => $this->publicContent($attempt->generated),
            'remainingSeconds' => max(0, $drill->payload['timeLimitSeconds'] - $this->elapsedSeconds($attempt)),
        ];
    }

    private function elapsedSeconds(DrillAttempt $attempt): int
    {
        return now()->timestamp - $attempt->generated['startedAt'];
    }

    private function isLate(CurriculumDrill $drill, DrillAttempt $attempt): bool
    {
        return $this->elapsedSeconds($attempt) > $drill->payload['timeLimitSeconds'] + self::GRACE_SECONDS;
    }

    private function blockState(array $blocks): array
    {
        return ['done' => false, 'blockIndex' => count($blocks) - 1, 'totalBlocks' => self::BLOCKS, 'block' => $this->publicContent(end($blocks))];
    }

    public function submitQuiz(User $user, CurriculumDrill $drill, array $responses, array $key): array
    {
        $attempt = $this->openAttempt($user, $drill);
        return $this->finishQuiz($user, $drill, $attempt, $responses, $this->grade($drill->payload['questions'], $key, $responses));
    }

    public function submitPassage(User $user, CurriculumDrill $drill, array $responses): array
    {
        $attempt = $this->openAttempt($user, $drill);
        abort_unless($attempt->generated, 422, 'Start this drill before submitting it.');

        $key = [];
        foreach ($attempt->generated['answers'] as $id => $answer) {
            $key[$id] = ['answer' => $answer];
        }

        $late = $this->isLate($drill, $attempt);
        $responses = $late ? [] : $responses;

        return $this->finishQuiz($user, $drill, $attempt, $responses, $this->grade($attempt->generated['questions'], $key, $responses), !$late) + ['late' => $late];
    }

    /** $blockIndex is the block the learner answered, so a retried request cannot be graded against a later block. */
    public function nextBlock(User $user, CurriculumDrill $drill, array $responses, int $blockIndex, string $apiKey): array
    {
        $attempt = $this->findOpenAttempt($user, $drill);

        if (!$attempt?->generated) {
            $finished = DrillAttempt::where('user_id', $user->id)->where('drill_id', $drill->id)->whereNotNull('submitted_at')->latest('id')->first();
            abort_unless($finished && $blockIndex === self::BLOCKS - 1, 422, 'Start this drill before submitting it.');

            return ['done' => true, 'passed' => true, 'band' => $finished->score, 'lessonCompleted' => true, 'rewriteCreated' => false];
        }

        $blocks = $attempt->generated['blocks'];
        $index = count($blocks) - 1;

        if ($blockIndex !== $index) {
            return $this->blockState($blocks);
        }

        $current = $blocks[$index];

        $key = [];
        foreach ($current['answers'] as $id => $answer) {
            $key[$id] = ['answer' => $answer];
        }
        $graded = $this->grade($current['questions'], $key, $responses);
        $ratio = $graded['correct'] / max(1, $graded['total']);

        $blocks[$index]['responses'] = $responses;
        $blocks[$index]['ratio'] = $ratio;

        if ($index + 1 < self::BLOCKS) {
            $step = $ratio >= 0.8 ? 1 : ($ratio < 0.4 ? -1 : 0);
            $band = max(self::MIN_BAND, min(self::MAX_BAND, $current['difficulty'] + $step));
            $blocks[] = $this->generateBlock($drill, $band, $index + 1, $apiKey);
            $attempt->update(['generated' => ['blocks' => $blocks]]);
            return $this->blockState($blocks);
        }

        $estimates = array_map(fn ($b) => $b['difficulty'] - 1 + 2 * $b['ratio'], $blocks);
        $band = max(self::MIN_BAND, min(9, BandScale::roundHalf(array_sum($estimates) / count($estimates))));

        $attempt->fill([
            'generated'    => ['blocks' => $blocks],
            'response'     => ['blocks' => array_column($blocks, 'responses')],
            'evaluation'   => ['band' => $band],
            'score'        => $band,
            'passed'       => true,
            'submitted_at' => now(),
        ])->save();

        $this->recordDiagnostic($user, $drill, $band);

        return ['done' => true, 'passed' => true, 'band' => $band] + $this->progress->afterPass($user, $drill);
    }

    public function submitAi(User $user, CurriculumDrill $drill, string $text, string $apiKey): array
    {
        $payload = $drill->payload;
        $mode = $drill->type === 'ai_speaking' ? 'spoken answer (voice-transcribed)' : 'written response';
        $task = $payload['task'] ?? $payload['question'] ?? '';
        $context = isset($payload['context']) ? "\nData given to the learner:\n{$payload['context']}" : '';

        $message = "Exercise: {$drill->title}\nStep goal: {$drill->answer_key['rubric']}\nResponse type: {$mode}\nTask: {$task}{$context}\n\n<learner_response>\n{$text}\n</learner_response>";

        $evaluation = $this->claude->getJson($apiKey, Prompts::forLearner(Prompts::DRILL_EVALUATOR, $user), $message, 3000);

        $diagnostic = isset($payload['diagnosticSkill']);
        $band = (float) ($evaluation['band'] ?? 0);
        $passed = $diagnostic || !empty($evaluation['meetsStepGoal']);

        $attempt = $this->openAttempt($user, $drill);
        $attempt->fill([
            'response'     => ['text' => $text],
            'evaluation'   => $evaluation,
            'score'        => $band,
            'passed'       => $passed,
            'submitted_at' => now(),
        ])->save();

        $skill = $drill->lesson->module->skill === 'foundation' ? ($payload['diagnosticSkill'] ?? 'writing') : $drill->lesson->module->skill;
        ErrorBank::safely(fn () => $this->errors->captureMany($user, $skill, $evaluation['errors'] ?? [], $attempt->id));

        if ($diagnostic) $this->recordDiagnostic($user, $drill, $band);

        $this->activity->touchStreak($user);

        return ['passed' => $passed, 'band' => $band, 'evaluation' => $evaluation]
            + ($passed ? $this->progress->afterPass($user, $drill) : ['lessonCompleted' => false, 'rewriteCreated' => false]);
    }

    /** Compares two answers. Answer keys may list alternatives separated by "/" and may hold only a letter. */
    public static function matches(string $given, string $expected): bool
    {
        $given = ErrorBank::normalize($given);
        if ($given === '') return false;

        foreach (explode('/', $expected) as $option) {
            $option = ErrorBank::normalize($option);
            if ($given === $option) return true;
            if (strlen($option) === 1 && str_starts_with($given, $option . '. ')) return true;
        }

        return false;
    }

    public function grade(array $questions, array $key, array $responses): array
    {
        $results = [];
        $correct = 0;

        foreach ($questions as $question) {
            $id = (string) $question['id'];
            $expected = (string) ($key[$id]['answer'] ?? '');
            $given = (string) ($responses[$id] ?? '');
            $isCorrect = self::matches($given, $expected);
            $correct += $isCorrect ? 1 : 0;
            $results[] = [
                'id'       => $question['id'],
                'type'     => $question['type'] ?? null,
                'question' => $question['question'],
                'given'    => $given,
                'expected' => $expected,
                'expectedText' => self::optionText($question, $expected),
                'correct'  => $isCorrect,
                'explain'  => $key[$id]['explain'] ?? null,
            ];
        }

        return ['results' => $results, 'correct' => $correct, 'total' => count($questions)];
    }

    /** A letter answer is shown with its option text, so "B" reads as "B. The number of cars has risen." */
    private static function optionText(array $question, string $expected): string
    {
        if (strlen($expected) === 1) {
            foreach ($question['options'] ?? [] as $option) {
                if (is_string($option) && str_starts_with(strtoupper($option), strtoupper($expected) . '.')) return $option;
            }
        }

        return explode('/', $expected)[0];
    }

    /** Strips answer data before content goes to the browser. */
    public function publicContent(array $content): array
    {
        unset($content['answers'], $content['responses'], $content['ratio'], $content['startedAt']);
        return $content;
    }

    private function finishQuiz(User $user, CurriculumDrill $drill, DrillAttempt $attempt, array $responses, array $graded, bool $logErrors = true): array
    {
        $percent = $graded['total'] ? round($graded['correct'] / $graded['total'] * 100, 2) : 0;
        $passed = $percent >= self::PASS_PERCENT;

        $attempt->fill([
            'response'     => $responses,
            'evaluation'   => $graded,
            'score'        => $percent,
            'passed'       => $passed,
            'submitted_at' => now(),
        ])->save();

        $skill = $drill->lesson->module->skill;
        if ($logErrors && in_array($skill, ['reading', 'listening'], true)) {
            foreach ($graded['results'] as $result) {
                if (!$result['correct']) {
                    $weakness = Weakness::fromQuiz($drill->lesson->slug, $result['type']);
                    $this->errors->capture($user, $skill, $skill === 'reading' ? 'reading_logic' : 'listening_trap', $result['question'], $result['expected'], $result['explain'], $attempt->id, $weakness);
                }
            }
        }

        $this->activity->touchStreak($user);

        return ['passed' => $passed, 'percent' => $percent, 'correct' => $graded['correct'], 'total' => $graded['total'], 'results' => $graded['results']]
            + ($passed ? $this->progress->afterPass($user, $drill) : ['lessonCompleted' => false, 'rewriteCreated' => false]);
    }

    private function recordDiagnostic(User $user, CurriculumDrill $drill, float $band): void
    {
        $skill = $drill->payload['diagnosticSkill'];
        DiagnosticResult::updateOrCreate(['user_id' => $user->id, 'skill' => $skill], ['band' => $band]);
        $this->activity->recordBand($user, $skill, $band);
        $this->activity->touchStreak($user);
    }

    private function generateBlock(CurriculumDrill $drill, int $band, int $index, string $apiKey): array
    {
        $skill = $drill->payload['diagnosticSkill'];
        $block = $this->pooled('diagnostic', "{$skill}:band:{$band}:block:{$index}", Prompts::DIAGNOSTIC_BLOCK_GENERATOR, "Generate block for skill: {$skill}. Target Band {$band} difficulty.", 2500, $apiKey, 'text', 4);
        return $block + ['difficulty' => $band];
    }

    /**
     * Passages start half a band above the learner's placement result and rise half a band for each
     * passage passed, never above the target. A learner at Band 5 aiming for 7 is not handed Band 7
     * texts on day one.
     */
    public function passageBand(User $user): float
    {
        $target = (float) ($user->target_band ?? 7);
        $placement = DiagnosticResult::where('user_id', $user->id)->where('skill', 'reading')->value('band');

        if ($placement === null) {
            $band = 6.0;
        } else {
            $passed = DrillAttempt::where('user_id', $user->id)
                ->where('passed', true)
                ->whereHas('drill', fn ($q) => $q->where('type', 'timed_passage'))
                ->count();
            $band = (float) $placement + 0.5 + 0.5 * $passed;
        }

        // Rounded down to a half band, so the level moves in half steps and never passes the target.
        $band = min($band, $target, self::MAX_PASSAGE_BAND);
        return max(min(self::MIN_PASSAGE_BAND, $target), floor($band * 2) / 2);
    }

    private function generatePassage(User $user, CurriculumDrill $drill, string $apiKey): array
    {
        $count = $drill->payload['questionCount'];
        $band = $this->passageBand($user);
        return $this->pooled('timed_reading', "q:{$count}:band:{$band}", Prompts::TIMED_READING_GENERATOR, "Generate a passage with exactly {$count} questions at Band {$band} difficulty.", 5000, $apiKey, 'passage', $count - 1) + ['band' => $band];
    }

    /** Reuses stored content once the pool is full, so repeat learners do not pay for new generations. */
    private function pooled(string $type, string $key, string $prompt, string $message, int $maxTokens, string $apiKey, string $textKey, int $minQuestions): array
    {
        if (AiCache::where('type', $type)->where('cache_key', $key)->count() >= self::AI_POOL) {
            return AiCache::getCached($type, $key);
        }

        $generated = $this->claude->getJson($apiKey, $prompt, $message, $maxTokens);
        GeneratedContent::assertQuestionUnit($generated, $textKey, $minQuestions);
        AiCache::putCache($type, $key, $generated, self::AI_POOL);

        return $generated;
    }
}
