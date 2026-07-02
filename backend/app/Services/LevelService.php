<?php

namespace App\Services;

use App\Models\User;

class LevelService
{
    public const MIN_LEVEL = 5;
    public const MAX_LEVEL = 9;
    public const LEVELED_MODULES = ['reading', 'listening'];

    public static function unlockedLevel(User $user, string $module): int
    {
        $level = self::MIN_LEVEL;

        $bandScores = $user->learningSessions()
            ->where('module', $module)
            ->whereNotNull('band_score')
            ->orderBy('created_at')
            ->pluck('band_score');

        foreach ($bandScores as $bandScore) {
            while ($level < self::MAX_LEVEL && $bandScore >= $level + 1) {
                $level++;
            }
        }

        return $level;
    }

    public static function allLevels(User $user): array
    {
        $levels = [];
        foreach (self::LEVELED_MODULES as $module) {
            $levels[$module] = self::unlockedLevel($user, $module);
        }
        return $levels;
    }
}
