<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Services\ClaudeService;
use App\Services\Prompts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIMockTestController extends Controller
{
    public function __construct(private ClaudeService $claude) {}

    public function evaluate(Request $request): JsonResponse
    {
        $request->validate([
            'writing_response' => 'nullable|string',
            'speaking_summary' => 'nullable|string',
            'reading_score' => 'nullable|numeric|min:0|max:9',
            'listening_score' => 'nullable|numeric|min:0|max:9',
        ]);

        $user = $request->user();
        $apiKey = $user->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        $userMessage = "Evaluate this IELTS Mock Test:\n\n";
        if ($request->writing_response) $userMessage .= "Writing Response:\n{$request->writing_response}\n\n";
        if ($request->speaking_summary) $userMessage .= "Speaking Session Summary:\n{$request->speaking_summary}\n\n";
        if ($request->reading_score) $userMessage .= "Reading self-assessed score: {$request->reading_score}\n";
        if ($request->listening_score) $userMessage .= "Listening self-assessed score: {$request->listening_score}\n";

        try {
            $result = $this->claude->getJson(
                $apiKey,
                Prompts::MOCK_TEST_EVALUATOR,
                $userMessage,
                2000
            );
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
