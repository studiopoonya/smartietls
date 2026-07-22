<?php

namespace App\Http\Controllers;

use App\Models\LessonCompletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudyPlanController extends Controller
{
    private const TOTAL_LESSONS = 20;

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'study_weeks'     => 'required|in:2,4,8',
            'reminder_time'   => 'required|date_format:H:i',
            'reminder_enabled' => 'boolean',
        ]);

        $request->user()->update([
            'study_weeks'      => $request->study_weeks,
            'plan_start_date'  => now()->toDateString(),
            'reminder_time'    => $request->reminder_time,
            'reminder_enabled' => $request->boolean('reminder_enabled', true),
        ]);

        return response()->json(['success' => true, 'user' => $request->user()->fresh()]);
    }

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->study_weeks || !$user->plan_start_date) {
            return response()->json(['plan' => null]);
        }

        $completed  = LessonCompletion::where('user_id', $user->id)->count();
        $totalDays  = $user->study_weeks * 7;
        $dayNumber  = (int) now()->diffInDays($user->plan_start_date) + 1;
        $dayNumber  = min($dayNumber, $totalDays);
        $expected   = (int) ceil(self::TOTAL_LESSONS * $dayNumber / $totalDays);
        $expected   = min($expected, self::TOTAL_LESSONS);

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
                'total_lessons'     => self::TOTAL_LESSONS,
                'on_track'          => $completed >= $expected,
                'finished'          => $completed >= self::TOTAL_LESSONS,
            ],
        ]);
    }
}
