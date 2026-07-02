<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClaudeService
{
    public function chat(string $apiKey, string $systemPrompt, string $userMessage, int $maxTokens = 2000, string $model = 'claude-sonnet-4-6'): array
    {
        set_time_limit(180);
        $response = Http::withHeaders([
            'x-api-key' => $apiKey,
            'anthropic-version' => '2023-06-01',
            'Content-Type' => 'application/json',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model' => $model,
            'max_tokens' => $maxTokens,
            'system' => $systemPrompt,
            'messages' => [['role' => 'user', 'content' => $userMessage]],
        ]);

        if ($response->failed()) {
            $body = $response->body();
            Log::error('Claude API failed [' . $response->status() . ']: ' . $body);
            throw new \Exception('Claude API error [' . $response->status() . ']: ' . $body);
        }

        return $response->json();
    }

    public function getText(string $apiKey, string $systemPrompt, string $userMessage, int $maxTokens = 2000, string $model = 'claude-sonnet-4-6'): string
    {
        $data = $this->chat($apiKey, $systemPrompt, $userMessage, $maxTokens, $model);
        return $data['content'][0]['text'] ?? '';
    }

    public function getJson(string $apiKey, string $systemPrompt, string $userMessage, int $maxTokens = 2000, string $model = 'claude-sonnet-4-6'): array
    {
        $text = $this->getText($apiKey, $systemPrompt, $userMessage, $maxTokens, $model);
        $text = trim($text);

        // 1. Try direct parse first
        $decoded = json_decode($text, true);
        if ($decoded !== null) return $decoded;

        // 2. Strip markdown fences and try again
        $stripped = preg_replace('/^```(?:json)?\s*/i', '', $text);
        $stripped = preg_replace('/\s*```\s*$/', '', $stripped);
        $stripped = trim($stripped);
        $decoded = json_decode($stripped, true);
        if ($decoded !== null) return $decoded;

        // 3. Extract the first {...} block from the text (handles preamble/postamble)
        if (preg_match('/(\{[\s\S]*\})/s', $text, $m)) {
            $decoded = json_decode($m[1], true);
            if ($decoded !== null) return $decoded;
        }

        throw new \Exception('AI returned invalid JSON: ' . substr($text, 0, 300));
    }
}
