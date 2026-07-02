<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Services\ClaudeService;
use App\Services\Prompts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AISpeakingController extends Controller
{
    public function __construct(private ClaudeService $claude) {}

    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string',
            'history' => 'nullable|array',
        ]);

        $user = $request->user();
        $apiKey = $user->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        $history = $request->history ?? [];
        $contextStr = '';
        foreach ($history as $turn) {
            $role = $turn['role'] === 'user' ? 'Candidate' : 'Examiner';
            $contextStr .= "{$role}: {$turn['content']}\n";
        }
        $userMessage = $contextStr . "Candidate: {$request->message}";

        try {
            $result = $this->claude->getJson(
                $apiKey,
                Prompts::SPEAKING_EXAMINER,
                $userMessage,
                2000
            );
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Speaking chat error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function generate(Request $request): JsonResponse
    {
        $user = $request->user();
        $apiKey = $user->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        try {
            $result = $this->claude->getJson(
                $apiKey,
                Prompts::SPEAKING_QUESTION_GENERATOR,
                'Generate a new IELTS Speaking test question set with a random topic.',
                1500
            );
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Speaking generate error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function evaluate(Request $request): JsonResponse
    {
        $request->validate([
            'question' => 'required|string',
            'answer'   => 'required|string',
            'part'     => 'required|integer|in:1,2,3',
        ]);

        $user = $request->user();
        $apiKey = $user->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        $userMessage = "Part {$request->part} Question: {$request->question}\n\nCandidate's Answer: {$request->answer}";

        try {
            $result = $this->claude->getJson(
                $apiKey,
                Prompts::SPEAKING_ANSWER_EVALUATOR,
                $userMessage,
                1500
            );
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Speaking evaluate error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
