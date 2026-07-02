<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Services\ClaudeService;
use App\Services\Prompts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIWritingController extends Controller
{
    public function __construct(private ClaudeService $claude) {}

    public function analyze(Request $request): JsonResponse
    {
        $request->validate([
            'essay' => 'required|string|min:50',
            'task_type' => 'required|in:task1,task2',
            'prompt' => 'required|string',
        ]);

        $user = $request->user();
        if (!$user->hasApiKey()) {
            return response()->json(['message' => 'API key not configured'], 422);
        }

        $userMessage = "Task Type: IELTS Writing {$request->task_type}\nPrompt: {$request->prompt}\n\nEssay:\n{$request->essay}";

        try {
            $result = $this->claude->getJson(
                $user->getDecryptedApiKey(),
                Prompts::WRITING_EVALUATOR,
                $userMessage,
                3000
            );
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
