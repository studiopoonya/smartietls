<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Services\ClaudeService;
use App\Services\Prompts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIVocabularyController extends Controller
{
    public function __construct(private ClaudeService $claude) {}

    public function explain(Request $request): JsonResponse
    {
        $request->validate([
            'word' => 'required|string|max:100',
            'context' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        if (!$user->hasApiKey()) {
            return response()->json(['message' => 'API key not configured'], 422);
        }

        $context = $request->context ? " (seen in context: \"{$request->context}\")" : '';
        $userMessage = "Explain the word \"{$request->word}\"{$context} for IELTS preparation.";

        try {
            $result = $this->claude->getJson(
                $user->getDecryptedApiKey(),
                Prompts::VOCAB_COACH,
                $userMessage,
                600,
                'claude-haiku-4-5-20251001'
            );
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
