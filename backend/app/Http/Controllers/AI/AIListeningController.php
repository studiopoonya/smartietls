<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\AiCache;
use App\Services\ClaudeService;
use App\Services\LevelService;
use App\Services\Prompts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AIListeningController extends Controller
{
    public function __construct(private ClaudeService $claude) {}

    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'section'    => 'nullable|integer|min:1|max:4',
            'difficulty' => 'nullable|integer|min:5|max:9',
        ]);

        $user = $request->user();
        if (!$user->hasApiKey()) {
            return response()->json(['message' => 'API key not configured'], 422);
        }

        $unlocked   = LevelService::unlockedLevel($user, 'listening');
        $section    = $request->section ?? rand(1, 4);
        $requested  = (int) ($request->difficulty ?? $unlocked);
        $difficulty = max(LevelService::MIN_LEVEL, min($requested, $unlocked));
        $cacheKey   = "section:{$section}:diff:{$difficulty}";

        // Return cached exercise if available
        $cached = AiCache::getCached('listening', $cacheKey);
        if ($cached) {
            return response()->json(array_merge($cached, ['difficulty' => $difficulty, '_cached' => true]));
        }

        $sectionDescriptions = [
            1 => 'a social dialogue between two people in an everyday context (booking, enquiry, registration)',
            2 => 'a social monologue about local facilities, services, or a community event',
            3 => 'an academic discussion between students or a student and tutor about a study topic',
            4 => 'an academic lecture by a professor or expert on an educational topic',
        ];
        $desc        = $sectionDescriptions[$section];
        $userMessage = "Generate an IELTS Listening Section {$section} exercise: {$desc}. Target Band {$difficulty} difficulty.";

        try {
            $result = $this->claude->getJson(
                $user->getDecryptedApiKey(),
                Prompts::LISTENING_GENERATOR,
                $userMessage,
                4000
            );
            AiCache::putCache('listening', $cacheKey, $result);
            return response()->json(array_merge($result, ['difficulty' => $difficulty]));
        } catch (\Exception $e) {
            Log::error('Listening generate error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
