<?php

namespace App\Services;

use App\Models\ErrorLogEntry;
use App\Models\User;
use Illuminate\Support\Collection;

/** Phase 3: turns evaluation results into the learner's error log and daily practice list. */
class ErrorBank
{
    public const DAILY_LIMIT = 5;
    private const REVIEWS_TO_CLEAR = 2;
    private const PRACTICE_CATEGORIES = ['grammar', 'collocation', 'vocabulary', 'low_value_sentence'];
    private const MAX_GROUPS = 8;

    public function capture(User $user, string $skill, string $category, string $original, string $correction, ?string $explanation = null, ?int $attemptId = null, ?string $weakness = null): void
    {
        $original = trim($original);
        $correction = trim($correction);
        if ($original === '' || $correction === '' || self::normalize($original) === self::normalize($correction)) return;

        $practice = in_array($category, self::PRACTICE_CATEGORIES, true);
        $state = [
            'status'         => $practice ? 'quarantined' : 'logged',
            'next_review_at' => $practice ? now() : null,
            'weakness'       => Weakness::resolve($skill, $category, $weakness),
        ];
        $fingerprint = sha1(self::normalize($original));

        $entry = ErrorLogEntry::where('user_id', $user->id)->where('fingerprint', $fingerprint)->first();

        if ($entry) {
            $entry->update($state + [
                'occurrences'      => $entry->occurrences + 1,
                'correction'       => $correction,
                'explanation'      => $explanation,
                'drill_attempt_id' => $attemptId ?? $entry->drill_attempt_id,
                'correct_reviews'  => 0,
            ]);
            return;
        }

        ErrorLogEntry::create($state + [
            'user_id'          => $user->id,
            'drill_attempt_id' => $attemptId,
            'skill'            => $skill,
            'category'         => $category,
            'fingerprint'      => $fingerprint,
            'original'         => $original,
            'correction'       => $correction,
            'explanation'      => $explanation,
        ]);
    }

    /**
     * Files a list of AI-reported errors. AI output is untrusted, so anything that is not a list of
     * objects with text fields is skipped instead of throwing after the evaluation has succeeded.
     *
     * @param mixed $errors normally array<int, array{category?: string, weakness?: string, original?: string, correction?: string, explanation?: string}>
     */
    public function captureMany(User $user, string $skill, mixed $errors, ?int $attemptId = null, string $correctionKey = 'correction', string $explanationKey = 'explanation', ?string $category = null): void
    {
        if (!is_array($errors)) return;

        foreach ($errors as $error) {
            if (!is_array($error)) continue;
            $original = $error['original'] ?? null;
            $correction = $error[$correctionKey] ?? null;
            if (!is_string($original) || !is_string($correction)) continue;

            $type = $category ?? (in_array($error['category'] ?? '', self::PRACTICE_CATEGORIES, true) ? $error['category'] : 'grammar');
            $weakness = is_string($error['weakness'] ?? null) ? $error['weakness'] : null;
            $explanation = is_string($error[$explanationKey] ?? null) ? $error[$explanationKey] : null;
            $this->capture($user, $skill, $type, $original, $correction, $explanation, $attemptId, $weakness);
        }
    }

    /** Files the errors from a full essay evaluation. Older responses without "errors" fall back to the vocabulary list. */
    public function captureEssay(User $user, array $result): void
    {
        if (!empty($result['errors']) && is_array($result['errors'])) {
            $this->captureMany($user, 'writing', $result['errors']);
            return;
        }

        $this->captureMany($user, 'writing', $result['highlights']['vocabularyToImprove'] ?? [], null, 'suggestion', 'reason', 'vocabulary');
    }

    /**
     * Runs a capture without letting it fail the request: the learner has already received (and the
     * platform has paid for) the evaluation, so a logging problem must not turn it into an error.
     */
    public static function safely(callable $capture): void
    {
        try {
            $capture();
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * An item waiting to be fixed from memory. Its correction stays hidden on the page until it has
     * been practised, otherwise the learner could copy the answer from the log.
     */
    public static function isDue(ErrorLogEntry $entry): bool
    {
        return $entry->status === 'quarantined' && ($entry->next_review_at === null || !$entry->next_review_at->isFuture());
    }

    public function dailyList(User $user): Collection
    {
        return ErrorLogEntry::where('user_id', $user->id)
            ->where('status', 'quarantined')
            ->where('next_review_at', '<=', now())
            ->orderByDesc('occurrences')
            ->orderBy('next_review_at')
            ->limit(self::DAILY_LIMIT)
            ->get();
    }

    /** Active errors grouped by skill and weakness, the most frequent first. */
    public function weaknessGroups(User $user): array
    {
        return $this->activeEntries($user)
            ->groupBy(fn ($e) => $e->skill . '|' . Weakness::resolve($e->skill, $e->category, $e->weakness))
            ->map(function (Collection $entries, string $key) {
                [$skill, $weakness] = explode('|', $key);
                return [
                    'skill'       => $skill,
                    'weakness'    => $weakness,
                    'label'       => Weakness::label($skill, $weakness),
                    'count'       => $entries->count(),
                    'occurrences' => (int) $entries->sum('occurrences'),
                    'examples'    => $entries->sortByDesc('updated_at')->take(2)->map(fn ($e) => ['original' => $e->original, 'correction' => self::isDue($e) ? null : $e->correction])->values()->all(),
                ];
            })
            ->sortByDesc('occurrences')
            ->take(self::MAX_GROUPS)
            ->values()
            ->all();
    }

    /** The learner's own mistakes for one weakness, used to aim the practice questions. */
    public function examples(User $user, string $skill, string $weakness, int $limit = 5): Collection
    {
        return $this->activeEntries($user)
            ->where('skill', $skill)
            ->filter(fn ($e) => Weakness::resolve($e->skill, $e->category, $e->weakness) === $weakness)
            ->sortByDesc('occurrences')
            ->take($limit)
            ->values();
    }

    private function activeEntries(User $user): Collection
    {
        return ErrorLogEntry::where('user_id', $user->id)->where('status', '!=', 'cleared')->get();
    }

    public function practice(ErrorLogEntry $entry, string $answer): bool
    {
        $correct = self::normalize($answer) === self::normalize($entry->correction);

        if ($correct) {
            $reviews = $entry->correct_reviews + 1;
            $cleared = $reviews >= self::REVIEWS_TO_CLEAR;
            $entry->update([
                'correct_reviews' => $reviews,
                'status'          => $cleared ? 'cleared' : 'quarantined',
                'next_review_at'  => $cleared ? null : now()->addDay(),
            ]);
        } else {
            // The correction is revealed after a miss, so the item returns tomorrow to be recalled from memory.
            $entry->update(['correct_reviews' => 0, 'next_review_at' => now()->addDay()]);
        }

        return $correct;
    }

    public static function normalize(string $text): string
    {
        $text = mb_strtolower(trim($text));
        $text = preg_replace("/[^\p{L}\p{N}\s'%.-]/u", ' ', $text);
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text, ' .');
    }
}
