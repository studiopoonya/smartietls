<?php

namespace App\Http\Controllers;

use App\Models\LearningSession;
use App\Models\ProgressSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sessions = $request->user()->learningSessions()
            ->when($request->module, fn($q) => $q->where('module', $request->module))
            ->latest()
            ->paginate(15);

        return response()->json($sessions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module' => 'required|in:writing,speaking,reading,listening,mock_test',
            'input_data' => 'required|array',
            'ai_feedback' => 'required|array',
            'band_score' => 'nullable|numeric|min:0|max:9',
            'duration_seconds' => 'nullable|integer',
        ]);

        $session = $request->user()->learningSessions()->create($validated);

        if ($validated['band_score'] ?? null) {
            $this->updateProgressSnapshot($request->user(), $validated['module'], $validated['band_score']);
        }

        $this->updateStreak($request->user());

        return response()->json($session, 201);
    }

    public function show(Request $request, LearningSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($session);
    }

    private function updateStreak($user): void
    {
        $today = now()->toDateString();
        $lastActive = $user->last_active_date?->toDateString();

        if ($lastActive === $today) return;

        $yesterday = now()->subDay()->toDateString();
        $newStreak = ($lastActive === $yesterday) ? $user->streak_days + 1 : 1;

        $user->update([
            'streak_days' => $newStreak,
            'last_active_date' => $today,
        ]);
    }

    private function updateProgressSnapshot($user, string $module, float $bandScore): void
    {
        $latest = $user->progressSnapshots()->latest()->first();

        $bands = [
            'writing_band' => $latest?->writing_band,
            'speaking_band' => $latest?->speaking_band,
            'reading_band' => $latest?->reading_band,
            'listening_band' => $latest?->listening_band,
        ];

        $key = $module . '_band';
        if (array_key_exists($key, $bands)) {
            $bands[$key] = $bandScore;
        }

        $existing = array_filter($bands);
        $overall = count($existing) > 0 ? array_sum($existing) / count($existing) : $bandScore;

        $user->progressSnapshots()->create(array_merge($bands, ['overall_band' => round($overall, 1)]));
    }
}
