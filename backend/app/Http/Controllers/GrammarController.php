<?php

namespace App\Http\Controllers;

use App\Models\GrammarCheck;
use App\Models\User;
use App\Models\WeaknessDrill;
use App\Services\ClaudeService;
use App\Services\ErrorBank;
use App\Services\Prompts;
use App\Services\StudyActivity;
use App\Services\Weakness;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/** Grammar Lab: sentence-level grammar checks with simple explanations, in English or Bahasa Indonesia. */
class GrammarController extends Controller
{
    public const DAILY_CHECKS = 20;
    private const MAX_ERRORS = 12;
    private const QUIZ_PASS = 4;
    private const MASTERY_MIN_WORDS = 15;

    public function __construct(
        private ClaudeService $claude,
        private ErrorBank $bank,
        private StudyActivity $activity,
    ) {}

    private function checksLeft(User $user): int
    {
        $used = GrammarCheck::where('user_id', $user->id)->where('created_at', '>=', now()->startOfDay())->count();
        return max(0, self::DAILY_CHECKS - $used);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'checksLeft' => $this->checksLeft($user),
            'progress'   => $this->progress($user),
            'recent'     => GrammarCheck::where('user_id', $user->id)->latest('id')->limit(8)->get()->map(fn ($c) => [
                'id'         => $c->id,
                'topic'      => $c->topic,
                'text'       => $c->text,
                'errorCount' => $c->error_count,
                'createdAt'  => $c->created_at->toIso8601String(),
                'result'     => $c->result,
            ]),
        ]);
    }

    /**
     * A rule counts as mastered once the learner scores at least 4/5 on its quiz and writes their own
     * sentences for it without a mistake on that rule.
     */
    private function progress(User $user): array
    {
        $quizPassed = WeaknessDrill::where('user_id', $user->id)
            ->where('skill', 'writing')
            ->where('correct', '>=', self::QUIZ_PASS)
            ->distinct()
            ->pluck('weakness')
            ->flip();

        $writingPassed = GrammarCheck::where('user_id', $user->id)
            ->whereNotNull('topic')
            ->get(['topic', 'text', 'result'])
            // Three short sentences are about 15 words, so a single phrase cannot count as mastery.
            ->filter(fn ($check) => str_word_count($check->text) >= self::MASTERY_MIN_WORDS
                && !collect($check->result['errors'] ?? [])->contains('weakness', $check->topic))
            ->pluck('topic')
            ->flip();

        $progress = [];
        foreach (array_keys(Weakness::LANGUAGE) as $topic) {
            $progress[$topic] = ['quiz' => $quizPassed->has($topic), 'writing' => $writingPassed->has($topic)];
        }

        return $progress;
    }

    public function check(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'text'     => 'required|string|min:10|max:2000',
            'topic'    => 'nullable|string|max:40',
            'language' => 'nullable|in:en,id',
        ]);

        $topic = $data['topic'] ?? null;
        abort_if($topic !== null && !array_key_exists($topic, Weakness::LANGUAGE), 422, 'Unknown grammar topic.');
        $language = $data['language'] ?? ($user->feedback_language ?? 'en');

        if ($this->checksLeft($user) === 0) {
            return response()->json(['message' => 'You have used today\'s ' . self::DAILY_CHECKS . ' grammar checks. New checks unlock tomorrow.'], 429);
        }

        $apiKey = $user->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        $message = 'Focus rule: ' . ($topic ? Weakness::LANGUAGE[$topic] : 'none') . "\n"
            . 'Explanation language: ' . ($language === 'id' ? 'Bahasa Indonesia' : 'simple English') . "\n\n"
            . "<learner_text>\n{$data['text']}\n</learner_text>";

        try {
            $raw = $this->claude->getJson($apiKey, Prompts::GRAMMAR_COACH, $message, 3000);
        } catch (\Exception $e) {
            Log::error('Grammar check error: ' . $e->getMessage());
            return response()->json(['message' => 'The grammar check failed. Please try again.'], 500);
        }

        $result = $this->clean($raw, $data['text']);
        ErrorBank::safely(fn () => $this->bank->captureMany($user, 'writing', $result['errors']));
        $this->activity->touchStreak($user);

        $check = GrammarCheck::create([
            'user_id'     => $user->id,
            'topic'       => $topic,
            'language'    => $language,
            'text'        => $data['text'],
            'result'      => $result,
            'error_count' => count($result['errors']),
        ]);

        return response()->json(['id' => $check->id, 'checksLeft' => $this->checksLeft($user)] + $result);
    }

    /** Keeps only well-formed output, so a partial AI answer never breaks the page. */
    private function clean(array $raw, string $original): array
    {
        $errors = [];
        foreach (is_array($raw['errors'] ?? null) ? $raw['errors'] : [] as $error) {
            if (!is_array($error) || !is_string($error['original'] ?? null) || !is_string($error['correction'] ?? null)) continue;
            if (trim($error['original']) === '') continue;
            $errors[] = [
                'category'    => in_array($error['category'] ?? '', ['grammar', 'collocation', 'vocabulary'], true) ? $error['category'] : 'grammar',
                'weakness'    => Weakness::resolve('writing', $error['category'] ?? 'grammar', is_string($error['weakness'] ?? null) ? $error['weakness'] : null),
                'original'    => $error['original'],
                'correction'  => $error['correction'],
                'explanation' => is_string($error['explanation'] ?? null) ? $error['explanation'] : null,
            ];
            if (count($errors) === self::MAX_ERRORS) break;
        }

        $strings = fn ($value) => array_values(array_filter(is_array($value) ? $value : [], 'is_string'));

        return [
            'correctedText' => is_string($raw['correctedText'] ?? null) && trim($raw['correctedText']) !== '' ? $raw['correctedText'] : $original,
            'errors'        => $errors,
            'strengths'     => array_slice($strings($raw['strengths'] ?? []), 0, 2),
            'focusFeedback' => is_string($raw['focusFeedback'] ?? null) ? $raw['focusFeedback'] : null,
            'nextTip'       => is_string($raw['nextTip'] ?? null) ? $raw['nextTip'] : null,
        ];
    }
}
