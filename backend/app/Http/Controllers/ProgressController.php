<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $snapshots = $user->progressSnapshots()->latest()->limit(30)->get();
        $latest = $snapshots->first();

        $moduleStats = [];
        foreach (['writing', 'speaking', 'reading', 'listening'] as $module) {
            $sessions = $user->learningSessions()
                ->where('module', $module)
                ->whereNotNull('band_score')
                ->orderBy('created_at')
                ->get(['band_score', 'created_at']);

            $moduleStats[$module] = [
                'sessions' => $sessions->count(),
                'latest_band' => $sessions->last()?->band_score,
                'avg_band' => $sessions->count() ? round($sessions->avg('band_score'), 1) : null,
                'history' => $sessions->map(fn($s) => [
                    'band' => $s->band_score,
                    'date' => $s->created_at->format('Y-m-d'),
                ]),
            ];
        }

        return response()->json([
            'latest_snapshot' => $latest,
            'module_stats' => $moduleStats,
            'total_sessions' => $user->learningSessions()->count(),
            'streak_days' => $user->streak_days,
        ]);
    }

    public function chartData(Request $request): JsonResponse
    {
        $user = $request->user();
        $days = $request->integer('days', 30);

        $snapshots = $user->progressSnapshots()
            ->where('created_at', '>=', now()->subDays($days))
            ->orderBy('created_at')
            ->get();

        return response()->json($snapshots->map(fn($s) => [
            'date' => $s->created_at->format('M d'),
            'overall' => (float) $s->overall_band,
            'writing' => $s->writing_band ? (float) $s->writing_band : null,
            'speaking' => $s->speaking_band ? (float) $s->speaking_band : null,
            'reading' => $s->reading_band ? (float) $s->reading_band : null,
            'listening' => $s->listening_band ? (float) $s->listening_band : null,
        ]));
    }
}
