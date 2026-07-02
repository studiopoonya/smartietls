<?php

namespace App\Http\Controllers;

use App\Services\ClaudeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class UserController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'target_band' => $user->target_band,
            'streak_days' => $user->streak_days,
            'last_active_date' => $user->last_active_date,
            'exam_date' => $user->exam_date?->toDateString(),
            'is_admin' => $user->is_admin,
            'has_api_key' => $user->hasApiKey(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'target_band' => 'sometimes|integer|min:4|max:9',
            'exam_date' => 'sometimes|nullable|date|after:today',
        ]);

        $request->user()->update($validated);

        return response()->json(['message' => 'Profile updated', 'user' => $request->user()]);
    }

    public function saveApiKey(Request $request): JsonResponse
    {
        $request->validate([
            'api_key' => 'required|string|starts_with:sk-ant-',
        ]);

        $request->user()->update(['anthropic_api_key' => $request->api_key]);

        return response()->json(['message' => 'API key saved successfully']);
    }

    public function testApiKey(Request $request): JsonResponse
    {
        $request->validate(['api_key' => 'required|string']);

        try {
            $claude = new ClaudeService();
            $result = $claude->getText(
                $request->api_key,
                'You are a helpful assistant.',
                'Say "API key is valid" in exactly 4 words.',
                20
            );
            return response()->json(['valid' => true, 'message' => $result]);
        } catch (\Exception $e) {
            return response()->json(['valid' => false, 'message' => 'Invalid API key'], 422);
        }
    }
}
