<?php

namespace App\Http\Controllers;

use App\Models\LearningSession;
use App\Services\StudyActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function __construct(private StudyActivity $activity) {}

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
            $this->activity->recordBand($request->user(), $validated['module'], (float) $validated['band_score']);
        }

        $this->activity->touchStreak($request->user());

        return response()->json($session, 201);
    }

    public function show(Request $request, LearningSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($session);
    }
}
