<?php

namespace Tests\Feature;

use App\Models\AiCache;
use App\Models\CurriculumDrill;
use App\Models\DiagnosticResult;
use App\Models\DrillAttempt;
use App\Models\GrammarCheck;
use App\Models\LessonCompletion;
use App\Models\User;
use App\Models\WeaknessDrill;
use App\Services\DrillEngine;
use Database\Seeders\CurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BeginnerSupportTest extends TestCase
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

    private function passTimedPassage(): void
    {
        DrillAttempt::create(['user_id' => $this->user->id, 'drill_id' => CurriculumDrill::where('type', 'timed_passage')->value('id'), 'passed' => true, 'score' => 80, 'submitted_at' => now()]);
    }

    public function test_reading_passages_start_near_the_placement_band_and_rise_to_the_target(): void
    {
        $engine = app(DrillEngine::class);
        $this->assertSame(6.0, $engine->passageBand($this->user), 'Without a placement result, passages start at Band 6.');

        DiagnosticResult::create(['user_id' => $this->user->id, 'skill' => 'reading', 'band' => 5]);
        $this->assertSame(5.5, $engine->passageBand($this->user), 'Half a band above placement, not a full band.');

        $this->passTimedPassage();
        $this->assertSame(6.0, $engine->passageBand($this->user), 'Each pass adds half a band.');

        foreach (range(1, 6) as $i) $this->passTimedPassage();
        $this->assertSame(7.0, $engine->passageBand($this->user), 'Never above the target band.');

        $this->user->update(['target_band' => 6.5]);
        DiagnosticResult::where('user_id', $this->user->id)->update(['band' => 6]);
        DrillAttempt::query()->delete();
        $this->assertSame(6.5, $engine->passageBand($this->user->fresh()), 'A half-band target is not rounded up past itself.');
    }

    public function test_feedback_language_setting_reaches_claude(): void
    {
        $this->putJson('/api/user/profile', ['feedback_language' => 'xx'])->assertStatus(422);
        $this->putJson('/api/user/profile', ['feedback_language' => 'id'])->assertOk();
        $this->getJson('/api/user')->assertJsonPath('feedback_language', 'id');

        $this->fakeClaude(['overallBand' => 6, 'criteria' => [], 'highlights' => [], 'errors' => []]);
        $this->postJson('/api/ai/writing/analyze', ['essay' => str_repeat('Students learn better online today. ', 4), 'task_type' => 'task2', 'prompt' => 'Discuss.'])->assertOk();
        Http::assertSent(fn ($request) => str_contains($request['system'], 'Bahasa Indonesia'));

        $this->user->update(['feedback_language' => 'en']);
        $this->fakeClaude(['overallBand' => 6, 'criteria' => [], 'highlights' => [], 'errors' => []]);
        $this->postJson('/api/ai/writing/analyze', ['essay' => str_repeat('Students learn better online today. ', 4), 'task_type' => 'task2', 'prompt' => 'Discuss.'])->assertOk();
        Http::assertSent(fn ($request) => !str_contains($request['system'], 'LANGUAGE:'));
    }

    public function test_lesson_explanation_in_bahasa_is_written_once_and_shared(): void
    {
        $this->fakeClaude(['summary' => 'Lesson ini mengajarkan cara membaca persyaratan.', 'points' => [['heading' => 'Poin 1', 'body' => 'Isi.'], 'junk'], 'takeaways' => ['Satu', 3]]);

        $this->getJson('/api/curriculum/lessons/diagnostic_listening/bahasa')
            ->assertOk()
            ->assertJsonPath('summary', 'Lesson ini mengajarkan cara membaca persyaratan.')
            ->assertJsonCount(1, 'points')
            ->assertJsonPath('takeaways', ['Satu']);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/curriculum/lessons/diagnostic_listening/bahasa')->assertOk();
        Http::assertSentCount(1);
        $this->assertSame(1, AiCache::where('type', 'lesson_bahasa')->count());

        // Locked lessons stay locked.
        $this->getJson('/api/curriculum/lessons/reading_tfng/bahasa')->assertStatus(423);
    }

    public function test_a_grammar_rule_is_mastered_after_the_quiz_and_a_clean_piece_of_writing(): void
    {
        $topic = 'articles';
        $progress = fn () => $this->getJson('/api/grammar')->assertOk()->json("progress.{$topic}");
        $this->assertSame(['quiz' => false, 'writing' => false], $progress());

        WeaknessDrill::create(['user_id' => $this->user->id, 'skill' => 'writing', 'weakness' => $topic, 'content' => [], 'correct' => 3, 'total' => 5, 'submitted_at' => now()]);
        $this->assertFalse($progress()['quiz']);
        WeaknessDrill::create(['user_id' => $this->user->id, 'skill' => 'writing', 'weakness' => $topic, 'content' => [], 'correct' => 4, 'total' => 5, 'submitted_at' => now()]);
        $this->assertTrue($progress()['quiz']);

        $long = 'I study at a university in Bandung. The campus is big and green. Education is important for every young person today.';
        GrammarCheck::create(['user_id' => $this->user->id, 'topic' => $topic, 'text' => $long, 'result' => ['errors' => [['weakness' => 'articles']]]]);
        GrammarCheck::create(['user_id' => $this->user->id, 'topic' => $topic, 'text' => 'A short clean line here.', 'result' => ['errors' => []]]);
        $this->assertFalse($progress()['writing'], 'A mistake on the rule, or a text that is too short, does not count.');

        GrammarCheck::create(['user_id' => $this->user->id, 'topic' => $topic, 'text' => $long, 'result' => ['errors' => [['weakness' => 'prepositions']]]]);
        $this->assertTrue($progress()['writing'], 'Mistakes on other rules do not block this one.');
    }
}
