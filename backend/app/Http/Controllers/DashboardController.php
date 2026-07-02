<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $recentSessions = $user->learningSessions()
            ->latest()
            ->limit(5)
            ->get(['id', 'module', 'band_score', 'duration_seconds', 'created_at']);

        $latestSnapshot = $user->progressSnapshots()->latest()->first();

        $sessionCounts = $user->learningSessions()
            ->selectRaw('module, count(*) as count')
            ->groupBy('module')
            ->pluck('count', 'module');

        $avgBandByModule = $user->learningSessions()
            ->selectRaw('module, avg(band_score) as avg_band')
            ->whereNotNull('band_score')
            ->groupBy('module')
            ->pluck('avg_band', 'module')
            ->map(fn($v) => round($v, 1));

        $this->updateStreak($user);

        return response()->json([
            'user' => [
                'name' => $user->name,
                'target_band' => $user->target_band,
                'streak_days' => $user->streak_days,
                'exam_date' => $user->exam_date?->toDateString(),
                'is_admin' => $user->is_admin,
                'has_api_key' => $user->hasApiKey(),
            ],
            'stats' => [
                'total_sessions' => $user->learningSessions()->count(),
                'vocab_saved' => $user->vocabularies()->count(),
                'session_counts' => $sessionCounts,
                'avg_bands' => $avgBandByModule,
            ],
            'latest_bands' => $latestSnapshot,
            'recent_sessions' => $recentSessions,
        ]);
    }

    private function updateStreak($user): void
    {
        $today = now()->toDateString();
        $lastActive = $user->last_active_date?->toDateString();

        if ($lastActive === $today) return;

        $yesterday = now()->subDay()->toDateString();
        $newStreak = ($lastActive === $yesterday) ? $user->streak_days + 1 : 1;

        $user->update(['streak_days' => $newStreak, 'last_active_date' => $today]);
    }
}
