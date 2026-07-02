<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\AiCache;
use App\Services\ClaudeService;
use App\Services\LevelService;
use App\Services\Prompts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIReadingController extends Controller
{
    public function __construct(private ClaudeService $claude) {}

    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'topic'      => 'nullable|string|max:100',
            'difficulty' => 'nullable|in:5,6,7,8,9',
        ]);

        $user = $request->user();
        $apiKey = $user->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        $unlocked   = LevelService::unlockedLevel($user, 'reading');
        $topic      = $request->topic ?? '';
        $requested  = (int) ($request->difficulty ?? $unlocked);
        $difficulty = max(LevelService::MIN_LEVEL, min($requested, $unlocked));
        $cacheKey   = 'topic:' . md5($topic) . ':diff:' . $difficulty;

        // Return cached passage if available
        $cached = AiCache::getCached('reading', $cacheKey);
        if ($cached) {
            return response()->json(array_merge($cached, ['difficulty' => $difficulty, '_cached' => true]));
        }

        $topicStr    = $topic ?: 'a random academic topic (science, technology, environment, or social issues)';
        $userMessage = "Generate an IELTS Academic Reading passage about {$topicStr} targeting Band {$difficulty} difficulty.";

        try {
            $result = $this->claude->getJson(
                $apiKey,
                Prompts::READING_GENERATOR,
                $userMessage,
                3000
            );
            AiCache::putCache('reading', $cacheKey, $result);
            return response()->json(array_merge($result, ['difficulty' => $difficulty]));
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
