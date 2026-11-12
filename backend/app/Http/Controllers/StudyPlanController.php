<?php

namespace App\Http\Controllers;

use App\Services\CurriculumProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudyPlanController extends Controller
{
    public function __construct(private CurriculumProgress $progress) {}

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'study_weeks'     => 'required|in:2,4,8',
            'reminder_time'   => 'required|date_format:H:i',
            'reminder_enabled' => 'boolean',
            'target_band'      => 'sometimes|numeric|min:4|max:9|multiple_of:0.5',
        ]);

        $request->user()->update([
            'study_weeks'      => $request->study_weeks,
            'plan_start_date'  => now()->toDateString(),
            'reminder_time'    => $request->reminder_time,
            'reminder_enabled' => $request->boolean('reminder_enabled', true),
            'target_band'      => $request->input('target_band', $request->user()->target_band),
        ]);

        return response()->json(['success' => true, 'user' => $request->user()->fresh()]);
    }

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->study_weeks || !$user->plan_start_date) {
            return response()->json(['plan' => null]);
        }

        $completed  = $this->progress->completedLessons($user);
        $total      = $this->progress->totalLessons();
        $totalDays  = $user->study_weeks * 7;
        $dayNumber  = (int) $user->plan_start_date->diffInDays(now(), true) + 1;
        $dayNumber  = min($dayNumber, $totalDays);
        $expected   = (int) ceil($total * $dayNumber / $totalDays);
        $expected   = min($expected, $total);

        return response()->json([
            'plan' => [
                'study_weeks'       => $user->study_weeks,
                'plan_start_date'   => $user->plan_start_date,
                'reminder_time'     => $user->reminder_time,
                'reminder_enabled'  => $user->reminder_enabled,
                'day_number'        => $dayNumber,
                'total_days'        => $totalDays,
                'completed_lessons' => $completed,
                'expected_lessons'  => $expected,
                'total_lessons'     => $total,
                'on_track'          => $completed >= $expected,
                'finished'          => $completed >= $total,
            ],
        ]);
    }
}
