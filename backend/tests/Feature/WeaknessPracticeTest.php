<?php

namespace Tests\Feature;

use App\Models\CurriculumDrill;
use App\Models\ErrorLogEntry;
use App\Models\User;
use App\Models\WeaknessDrill;
use App\Services\DrillEngine;
use App\Services\ErrorBank;
use App\Services\Prompts;
use App\Services\Weakness;
use Database\Seeders\CurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WeaknessPracticeTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CurriculumSeeder::class);
        $this->user = User::factory()->create(['target_band' => 7, 'anthropic_api_key' => 'test-key']);
        Sanctum::actingAs($this->user);
    }

    private function fakeClaude(array $json): void
    {
        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::fake(['api.anthropic.com/*' => Http::response(['content' => [['text' => json_encode($json)]]])]);
    }

    private function practiceSet(?string $text = null): array
    {
        $questions = [];
        $answers = [];
        $explanations = [];
        foreach (range(1, 5) as $id) {
            $questions[] = ['id' => $id, 'type' => 'mcq', 'question' => "Choose the correct sentence {$id}.", 'options' => ['A. He go to class.', 'B. He goes to class.', 'C. He going to class.']];
            $answers[(string) $id] = 'B';
            $explanations[(string) $id] = 'A singular subject takes a verb ending in -s.';
        }

        return ['title' => 'Agreement drill', 'tip' => 'Singular subject, singular verb.', 'text' => $text, 'questions' => $questions, 'answers' => $answers, 'explanations' => $explanations];
    }

    public function test_prompt_weakness_list_matches_the_taxonomy(): void
    {
        foreach (array_keys(Weakness::LANGUAGE) as $tag) {
            $this->assertStringContainsString($tag, Prompts::WEAKNESS_LIST);
        }
        $this->assertStringContainsString('"weakness"', Prompts::DRILL_EVALUATOR);
        $this->assertStringContainsString('subject_verb_agreement', Prompts::WRITING_EVALUATOR);
    }

    public function test_errors_are_filed_under_a_known_weakness(): void
    {
        $bank = app(ErrorBank::class);
        $bank->captureMany($this->user, 'writing', [
            ['category' => 'grammar', 'weakness' => 'subject_verb_agreement', 'original' => 'The data show', 'correction' => 'The data shows'],
            ['category' => 'grammar', 'weakness' => 'made_up_tag', 'original' => 'informations', 'correction' => 'information'],
            ['category' => 'collocation', 'original' => 'do a research', 'correction' => 'conduct research'],
        ]);

        $this->assertSame('subject_verb_agreement', ErrorLogEntry::where('original', 'The data show')->value('weakness'));
        $this->assertSame('other_grammar', ErrorLogEntry::where('original', 'informations')->value('weakness'));
        $this->assertSame('collocation', ErrorLogEntry::where('original', 'do a research')->value('weakness'));
    }

    public function test_reading_quiz_mistakes_are_filed_under_the_lesson_weakness(): void
    {
        $drill = CurriculumDrill::where('slug', 'reading_tfng_drill')->with('lesson.module')->first();
        app(DrillEngine::class)->submitQuiz($this->user, $drill, [], $drill->answer_key['questions']);

        $this->assertGreaterThan(0, ErrorLogEntry::where('user_id', $this->user->id)->count());
        $this->assertSame(['false_vs_not_given'], ErrorLogEntry::where('user_id', $this->user->id)->distinct()->pluck('weakness')->all());
    }

    public function test_error_bank_groups_weaknesses_and_links_the_fix_lesson(): void
    {
        $bank = app(ErrorBank::class);
        $bank->capture($this->user, 'writing', 'collocation', 'make a research', 'conduct research', null, null, 'collocation');
        $bank->capture($this->user, 'writing', 'collocation', 'make a research', 'conduct research', null, null, 'collocation');
        $bank->capture($this->user, 'writing', 'grammar', 'he go', 'he goes', null, null, 'subject_verb_agreement');
        // An entry from before weaknesses existed still lands in a group.
        ErrorLogEntry::create(['user_id' => $this->user->id, 'skill' => 'speaking', 'category' => 'grammar', 'fingerprint' => sha1('x'), 'original' => 'I am agree', 'correction' => 'I agree', 'status' => 'quarantined', 'next_review_at' => now()]);

        $groups = collect($this->getJson('/api/error-bank')->assertOk()->json('weaknesses'));

        $this->assertSame('collocation', $groups->first()['weakness']);
        $this->assertSame('writing_t2_tone', $groups->first()['lesson']['slug']);
        $this->assertTrue($groups->first()['lesson']['locked']);
        $this->assertNull($groups->firstWhere('weakness', 'subject_verb_agreement')['lesson']);
        $this->assertSame('Other grammar', $groups->firstWhere('skill', 'speaking')['label']);
    }

    public function test_malformed_error_lists_from_claude_never_fail_a_paid_evaluation(): void
    {
        $this->fakeClaude([
            'scores' => ['overall' => 6],
            'grammarErrors' => ['just a string', ['original' => ['not', 'text'], 'corrected' => 'x'], ['original' => 'I am agree', 'corrected' => 'I agree', 'weakness' => ['bad']]],
            'vocabularyUpgrades' => 'none',
        ]);

        $this->postJson('/api/ai/speaking/evaluate', ['question' => 'Do you like music?', 'answer' => 'Yes I am agree that music is good.', 'part' => 1])
            ->assertOk()->assertJsonPath('scores.overall', 6);

        $this->assertSame(['I am agree'], ErrorLogEntry::where('user_id', $this->user->id)->pluck('original')->all());

        $this->fakeClaude(['overallBand' => 6, 'errors' => 'none', 'highlights' => ['vocabularyToImprove' => [['original' => 'good', 'suggestion' => ['x']]]]]);
        $this->postJson('/api/ai/writing/analyze', ['essay' => str_repeat('Students learn better online today. ', 4), 'task_type' => 'task2', 'prompt' => 'Discuss.'])->assertOk();
    }

    public function test_answers_due_for_recall_are_hidden_until_practised(): void
    {
        app(ErrorBank::class)->capture($this->user, 'writing', 'grammar', 'he go', 'he goes', 'Singular verb.', null, 'subject_verb_agreement');
        $entry = ErrorLogEntry::where('user_id', $this->user->id)->first();

        $page = $this->getJson('/api/error-bank')->assertOk();
        $page->assertJsonPath('log.0.correction', null)->assertJsonPath('log.0.explanation', null)->assertJsonPath('log.0.hidden', true);
        $page->assertJsonPath('weaknesses.0.examples.0.correction', null);
        $this->assertStringNotContainsString('he goes', $page->getContent());

        // A miss reveals the answer and schedules the item for tomorrow, so it may be shown from then on.
        $this->postJson("/api/error-bank/{$entry->id}/practice", ['answer' => 'he going'])->assertOk()->assertJsonPath('correction', 'he goes');
        $this->getJson('/api/error-bank')->assertJsonPath('log.0.correction', 'he goes')->assertJsonPath('log.0.hidden', false);
    }

    public function test_practice_set_is_generated_reused_and_graded(): void
    {
        app(ErrorBank::class)->capture($this->user, 'writing', 'grammar', 'he go', 'he goes', null, null, 'subject_verb_agreement');
        $this->fakeClaude($this->practiceSet());

        $set = $this->postJson('/api/weakness-practice', ['skill' => 'writing', 'weakness' => 'subject_verb_agreement'])->assertOk()->json();
        $this->assertNull($set['text']);
        $this->assertCount(5, $set['questions']);
        $this->assertArrayNotHasKey('answers', $set);
        Http::assertSent(fn ($request) => str_contains(json_encode($request->data()), 'he go'));

        // Reopening returns the same unfinished set without another Claude call.
        $again = $this->postJson('/api/weakness-practice', ['skill' => 'writing', 'weakness' => 'subject_verb_agreement'])->assertOk()->json();
        $this->assertSame($set['id'], $again['id']);
        Http::assertSentCount(1);

        $responses = ['1' => 'B. He goes to class.', '2' => 'B. He goes to class.', '3' => 'A. He go to class.', '4' => 'B. He goes to class.', '5' => 'B. He goes to class.'];
        $result = $this->postJson("/api/weakness-practice/{$set['id']}/submit", ['responses' => $responses])->assertOk()->json();
        $this->assertSame(4, $result['correct']);
        $this->assertSame('A singular subject takes a verb ending in -s.', $result['results'][2]['explain']);

        $this->postJson("/api/weakness-practice/{$set['id']}/submit", ['responses' => $responses])->assertStatus(422);
    }

    public function test_reading_set_requires_a_passage(): void
    {
        $this->fakeClaude($this->practiceSet());
        $this->postJson('/api/weakness-practice', ['skill' => 'reading', 'weakness' => 'false_vs_not_given'])->assertStatus(500);
        $this->assertSame(0, WeaknessDrill::count());

        $this->fakeClaude($this->practiceSet('A short academic passage about coral reefs.'));
        $this->postJson('/api/weakness-practice', ['skill' => 'reading', 'weakness' => 'false_vs_not_given'])->assertOk()->assertJsonPath('text', 'A short academic passage about coral reefs.');
    }

    public function test_practice_sets_are_capped_per_day_and_private(): void
    {
        $this->postJson('/api/weakness-practice', ['skill' => 'writing', 'weakness' => 'nonsense'])->assertStatus(422);

        foreach (array_slice(array_keys(Weakness::LANGUAGE), 0, 5) as $tag) {
            WeaknessDrill::create(['user_id' => $this->user->id, 'skill' => 'speaking', 'weakness' => $tag, 'content' => $this->practiceSet(), 'submitted_at' => now()]);
        }
        $this->fakeClaude($this->practiceSet());
        $this->postJson('/api/weakness-practice', ['skill' => 'writing', 'weakness' => 'articles'])->assertStatus(429);
        $this->assertSame(0, $this->getJson('/api/error-bank')->json('practiceSetsLeft'));

        $other = WeaknessDrill::create(['user_id' => User::factory()->create()->id, 'skill' => 'writing', 'weakness' => 'articles', 'content' => $this->practiceSet()]);
        $this->postJson("/api/weakness-practice/{$other->id}/submit", ['responses' => []])->assertForbidden();
    }
}
