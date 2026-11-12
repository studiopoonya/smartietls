<?php

namespace App\Services;

use App\Models\User;

class StudyActivity
{
    public function touchStreak(User $user): void
    {
        $today = now()->toDateString();
        $lastActive = $user->last_active_date?->toDateString();

        if ($lastActive === $today) return;

        $yesterday = now()->subDay()->toDateString();

        $user->update([
            'streak_days'      => $lastActive === $yesterday ? $user->streak_days + 1 : 1,
            'last_active_date' => $today,
        ]);
    }

    public function recordBand(User $user, string $module, float $band): void
    {
        $this->recordBands($user, [$module => $band]);
    }

    /** Writes one snapshot however many skills changed, so a chart never shows a half-updated state. */
    public function recordBands(User $user, array $bandsByModule): void
    {
        $latest = $user->progressSnapshots()->latest('id')->first();

        $bands = [
            'writing_band'   => $latest?->writing_band,
            'speaking_band'  => $latest?->speaking_band,
            'reading_band'   => $latest?->reading_band,
            'listening_band' => $latest?->listening_band,
        ];

        foreach ($bandsByModule as $module => $band) {
            $key = $module . '_band';
            if (array_key_exists($key, $bands)) {
                $bands[$key] = $band;
            }
        }

        // A band of 0 is a real result, so only missing skills are left out of the average.
        $existing = array_filter($bands, fn ($band) => $band !== null);
        $values = $existing ?: $bandsByModule;

        $user->progressSnapshots()->create(array_merge($bands, ['overall_band' => round(array_sum($values) / count($values), 1)]));
    }
}
