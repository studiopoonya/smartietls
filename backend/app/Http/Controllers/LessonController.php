<?php

namespace App\Http\Controllers;

use App\Models\LessonCompletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function progress(Request $request): JsonResponse
    {
        $completed = LessonCompletion::where('user_id', $request->user()->id)
            ->pluck('lesson_id')
            ->toArray();

        return response()->json(['completed' => $completed]);
    }

    public function complete(Request $request, string $lessonId): JsonResponse
    {
        LessonCompletion::firstOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lessonId],
            ['completed_at' => now()]
        );

        return response()->json(['success' => true]);
    }
}
