<?php

namespace Tests\Feature;

use App\Models\ErrorLogEntry;
use App\Models\GrammarCheck;
use App\Models\User;
use App\Services\Prompts;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GrammarLabTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['anthropic_api_key' => 'test-key']);
        Sanctum::actingAs($this->user);
    }

    private function fakeClaude(array $json): void
    {
        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::fake(['api.anthropic.com/*' => Http::response(['content' => [['text' => json_encode($json)]]])]);
    }

    public function test_a_check_returns_corrections_and_files_them_in_the_error_bank(): void
    {
        $this->fakeClaude([
            'correctedText' => 'She has lived in Jakarta since 2019.',
            'errors' => [
                ['category' => 'grammar', 'weakness' => 'verb_tense', 'original' => 'is living', 'correction' => 'has lived', 'explanation' => 'Pakai present perfect (has lived) dengan "since".'],
                ['category' => 'grammar', 'weakness' => 'nonsense', 'original' => '', 'correction' => 'x'],
                'not an object',
            ],
            'strengths' => ['Good use of "since"', 42],
            'focusFeedback' => 'Kamu sudah hampir benar.',
            'nextTip' => 'Cek kata kerja setiap kalimat.',
        ]);

        $response = $this->postJson('/api/grammar/check', ['text' => 'She is living in Jakarta since 2019.', 'topic' => 'verb_tense', 'language' => 'id'])->assertOk();

        $response->assertJsonPath('correctedText', 'She has lived in Jakarta since 2019.')
            ->assertJsonCount(1, 'errors')
            ->assertJsonPath('errors.0.weakness', 'verb_tense')
            ->assertJsonPath('strengths', ['Good use of "since"'])
            ->assertJsonPath('checksLeft', 19);

        Http::assertSent(fn ($request) => str_contains($request['messages'][0]['content'], 'Focus rule: Verb tenses')
            && str_contains($request['messages'][0]['content'], 'Explanation language: Bahasa Indonesia'));

        $entry = ErrorLogEntry::where('user_id', $this->user->id)->first();
        $this->assertSame(['writing', 'verb_tense', 'quarantined'], [$entry->skill, $entry->weakness, $entry->status]);

        $this->getJson('/api/grammar')->assertOk()->assertJsonPath('recent.0.errorCount', 1)->assertJsonPath('checksLeft', 19);
    }

    public function test_a_broken_answer_falls_back_to_the_original_text(): void
    {
        $this->fakeClaude(['errors' => 'oops']);

        $this->postJson('/api/grammar/check', ['text' => 'This sentence is fine already.'])
            ->assertOk()
            ->assertJsonPath('correctedText', 'This sentence is fine already.')
            ->assertJsonPath('errors', [])
            ->assertJsonPath('focusFeedback', null);
    }

    public function test_checks_are_validated_and_capped_per_day(): void
    {
        $this->postJson('/api/grammar/check', ['text' => 'short'])->assertStatus(422);
        $this->postJson('/api/grammar/check', ['text' => 'A long enough sentence here.', 'topic' => 'made_up'])->assertStatus(422);
        $this->postJson('/api/grammar/check', ['text' => 'A long enough sentence here.', 'language' => 'fr'])->assertStatus(422);

        foreach (range(1, 20) as $i) {
            GrammarCheck::create(['user_id' => $this->user->id, 'text' => "t{$i}", 'result' => []]);
        }
        $this->fakeClaude(['correctedText' => 'x', 'errors' => []]);
        $this->postJson('/api/grammar/check', ['text' => 'A long enough sentence here.'])->assertStatus(429);
        Http::assertNothingSent();
    }

    public function test_coach_prompt_lists_the_weakness_tags(): void
    {
        $this->assertStringContainsString('subject_verb_agreement', Prompts::GRAMMAR_COACH);
        $this->assertStringContainsString('<learner_text>', Prompts::GRAMMAR_COACH);
    }
}
