<?php

namespace Tests\Feature;

use App\Models\CurriculumDrill;
use App\Models\CurriculumLesson;
use App\Models\CurriculumModule;
use App\Models\DiagnosticResult;
use App\Models\ErrorLogEntry;
use App\Models\ExamSimulation;
use App\Models\LessonCompletion;
use App\Models\RewriteChallenge;
use App\Models\User;
use App\Services\BandScale;
use App\Services\DrillEngine;
use App\Services\ExamEngine;
use Database\Seeders\CurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CurriculumFlowTest extends TestCase
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

    private function complete(string ...$lessonSlugs): void
    {
        foreach ($lessonSlugs as $slug) {
            LessonCompletion::create(['user_id' => $this->user->id, 'lesson_id' => $slug, 'completed_at' => now()]);
        }
    }

    private function completePlacement(): void
    {
        $this->complete('diagnostic_listening', 'diagnostic_reading', 'diagnostic_writing', 'diagnostic_speaking');
    }

    private function completeFoundation(): void
    {
        $ids = CurriculumModule::where('phase', 1)->pluck('id');
        $this->complete(...CurriculumLesson::whereIn('module_id', $ids)->pluck('slug'));
    }

    /** Each call replaces the previous fake; stacked Http::fake stubs would keep answering first. */
    private function fakeClaude(array ...$responses): void
    {
        Http::swap(new \Illuminate\Http\Client\Factory);

        $sequence = Http::sequence();
        foreach ($responses as $json) {
            $sequence->push(['content' => [['text' => json_encode($json)]]]);
        }
        $sequence->whenEmpty(Http::response(['content' => [['text' => json_encode(end($responses))]]]));

        Http::fake(['api.anthropic.com/*' => $sequence]);
    }

    private function correctAnswers(string $drillSlug): array
    {
        $key = CurriculumDrill::where('slug', $drillSlug)->first()->answer_key['questions'];
        return array_map(fn ($q) => explode('/', $q['answer'])[0], $key);
    }

    public function test_seeder_is_idempotent_and_covers_every_phase_2_skill(): void
    {
        $this->seed(CurriculumSeeder::class);

        $this->assertSame(1, \App\Models\CurriculumTrack::count());
        $this->assertSame(11, CurriculumModule::where('phase', 2)->count());
        $this->assertEqualsCanonicalizing(['reading', 'listening', 'writing', 'speaking'], CurriculumModule::where('phase', 2)->distinct()->pluck('skill')->all());
        $this->assertSame(0, CurriculumLesson::doesntHave('drills')->count());
    }

    public function test_every_quiz_answer_key_matches_one_of_its_options(): void
    {
        foreach (CurriculumDrill::where('type', 'quiz')->get() as $drill) {
            foreach ($drill->payload['questions'] as $question) {
                $expected = $drill->answer_key['questions'][(string) $question['id']]['answer'];
                $this->assertNotSame('', $expected, "{$drill->slug} Q{$question['id']} has no answer");

                if ($question['options']) {
                    $matches = array_filter($question['options'], fn ($option) => DrillEngine::matches($option, $expected));
                    $this->assertCount(1, $matches, "{$drill->slug} Q{$question['id']} must match exactly one option");
                }
            }
        }
    }

    public function test_answer_keys_are_never_sent_to_the_browser(): void
    {
        $this->completePlacement();
        $response = $this->getJson('/api/curriculum/lessons/foundation_academic_standard')->assertOk();

        $this->assertStringNotContainsString('"answer_key":', $response->getContent());
        $this->assertStringNotContainsString('"answer"', $response->getContent());
        $this->assertStringNotContainsString('explain', $response->getContent());
    }

    public function test_the_diagnostic_is_open_from_the_start_and_only_it_gates_phase_2(): void
    {
        $this->getJson('/api/curriculum/lessons/diagnostic_listening')->assertOk();
        $this->getJson('/api/curriculum/lessons/foundation_academic_standard')->assertStatus(423)->assertJson(['lockReason' => 'diagnostic']);

        $this->completePlacement();

        // The theory module is optional: Phase 2 opens without it, and it is available as a review.
        $this->getJson('/api/curriculum/lessons/reading_skimming')->assertOk();
        $this->getJson('/api/curriculum/lessons/foundation_academic_standard')->assertOk();
        $this->getJson('/api/curriculum')->assertOk()->assertJsonPath('gates.placementComplete', true);
    }

    public function test_skill_minimums_are_saved_and_reach_the_baseline(): void
    {
        $this->putJson('/api/user/profile', ['skill_minimums' => ['writing' => 6.5, 'speaking' => null]])->assertOk();
        $this->assertSame(6.5, (float) $this->getJson('/api/curriculum')->assertOk()->json('baseline.skillMinimums.writing'));

        $this->putJson('/api/user/profile', ['skill_minimums' => ['writing' => 6.3]])->assertStatus(422);
        $this->putJson('/api/user/profile', ['skill_minimums' => ['maths' => 6]])->assertStatus(422);
    }

    public function test_a_missed_skill_minimum_rules_out_ready(): void
    {
        $met = ['skill' => 'reading', 'band' => 7.0, 'required' => 6.0, 'met' => true];
        $halfBandShort = ['skill' => 'writing', 'band' => 5.5, 'required' => 6.0, 'met' => false];
        $farShort = ['skill' => 'writing', 'band' => 5.0, 'required' => 6.5, 'met' => false];
        $noScore = ['skill' => 'speaking', 'band' => null, 'required' => 6.0, 'met' => false];

        $this->assertSame('ready', ExamEngine::readinessVerdict(7.0, true, 7.0, []));
        $this->assertSame('ready', ExamEngine::readinessVerdict(7.0, true, 7.0, [$met]));
        $this->assertSame('almost', ExamEngine::readinessVerdict(7.0, true, 7.0, [$halfBandShort]));
        $this->assertSame('almost', ExamEngine::readinessVerdict(7.0, true, 7.0, [$noScore]));
        $this->assertSame('not_ready', ExamEngine::readinessVerdict(7.5, true, 7.0, [$farShort]));
        $this->assertSame('not_ready', ExamEngine::readinessVerdict(6.0, true, 7.0, [$met]));
        $this->assertSame('almost', ExamEngine::readinessVerdict(7.0, false, 7.0, []));
    }

    public function test_the_report_records_each_skill_minimum(): void
    {
        $this->user->update(['skill_minimums' => ['writing' => 7.0, 'reading' => 5.0, 'listening' => null]]);
        $exam = $this->examAt('evaluating', null, ['scores' => [
            'listening' => ['band' => 8.0], 'reading' => ['band' => 7.5], 'writing' => ['band' => 6.0],
        ]]);
        $this->fakeClaude(['summary' => 'S', 'strengths' => [], 'risks' => [], 'nextSteps' => []]);

        $report = $this->postJson("/api/exam/{$exam->id}/finalize")->assertOk()->assertJson(['status' => 'completed'])->json('report');

        $this->assertSame('not_ready', $report['verdict']);
        $this->assertEqualsCanonicalizing(['writing', 'reading'], array_column($report['skillChecks'], 'skill'));
        $writing = collect($report['skillChecks'])->firstWhere('skill', 'writing');
        $this->assertFalse($writing['met']);
    }

    public function test_phase_2_stays_locked_until_the_diagnostic_is_done(): void
    {
        $this->getJson('/api/curriculum/lessons/reading_skimming')->assertStatus(423)->assertJson(['lockReason' => 'diagnostic']);

        $this->completeFoundation();

        $this->getJson('/api/curriculum/lessons/reading_skimming')->assertOk();
    }

    public function test_lessons_unlock_in_sequence(): void
    {
        $this->completePlacement();
        $this->getJson('/api/curriculum/lessons/foundation_band_descriptors')->assertStatus(423)->assertJson(['lockReason' => 'previous_lesson']);

        $this->postJson('/api/drills/foundation_standard_check/submit', ['responses' => $this->correctAnswers('foundation_standard_check')])
            ->assertOk()
            ->assertJson(['passed' => true, 'lessonCompleted' => true]);

        $this->getJson('/api/curriculum/lessons/foundation_band_descriptors')->assertOk();
    }

    public function test_a_failed_quiz_does_not_complete_the_lesson(): void
    {
        $this->completePlacement();
        $this->postJson('/api/drills/foundation_standard_check/submit', ['responses' => []])
            ->assertOk()
            ->assertJson(['passed' => false, 'lessonCompleted' => false]);

        $this->assertFalse(LessonCompletion::where('lesson_id', 'foundation_academic_standard')->exists());
    }

    public function test_wrong_reading_answers_go_to_the_error_log_but_not_daily_practice(): void
    {
        $this->completeFoundation();
        $this->postJson('/api/drills/reading_skimming_drill/submit', ['responses' => ['1' => 'A', '2' => 'A']])->assertOk();

        $this->assertSame(2, ErrorLogEntry::where('category', 'reading_logic')->where('status', 'logged')->count());
        $this->getJson('/api/error-bank')->assertOk()->assertJsonCount(0, 'daily');
    }

    public function test_answer_matching_accepts_option_text_letters_and_alternatives(): void
    {
        $this->assertTrue(DrillEngine::matches('B. Her accessible style', 'B'));
        $this->assertTrue(DrillEngine::matches('b', 'B'));
        $this->assertTrue(DrillEngine::matches('  the Permafrost. ', 'permafrost/the permafrost'));
        $this->assertTrue(DrillEngine::matches('not given', 'NOT GIVEN'));
        $this->assertFalse(DrillEngine::matches('', 'B'));
        $this->assertFalse(DrillEngine::matches('C. Her style', 'B'));
    }

    public function test_diagnostic_writing_records_baseline_and_quarantines_errors(): void
    {
        $this->complete('diagnostic_listening', 'diagnostic_reading');

        $this->fakeClaude([
            'band' => 6, 'meetsStepGoal' => false, 'feedback' => 'x', 'strengths' => [], 'improvements' => [], 'modelAnswer' => 'x',
            'paragraphs' => [['text' => 'p', 'band' => 6, 'revisionAdvice' => 'a']],
            'errors' => [['category' => 'grammar', 'original' => 'people thinks', 'correction' => 'people think', 'explanation' => 'agreement']],
        ]);

        $this->postJson('/api/drills/diagnostic_writing_intro/submit', ['text' => str_repeat('universities should teach practical skills ', 8)])
            ->assertOk()->assertJson(['passed' => true, 'band' => 6, 'lessonCompleted' => true]);

        $this->assertSame(6.0, DiagnosticResult::where('skill', 'writing')->first()->band);

        $daily = $this->getJson('/api/error-bank')->assertOk()->assertJsonCount(1, 'daily')->json('daily.0');
        $this->assertArrayNotHasKey('correction', $daily);
    }

    public function test_error_practice_clears_an_item_after_two_correct_reviews(): void
    {
        $entry = ErrorLogEntry::create(['user_id' => $this->user->id, 'skill' => 'writing', 'category' => 'grammar', 'fingerprint' => sha1('x'), 'original' => 'people thinks', 'correction' => 'people think', 'status' => 'quarantined', 'next_review_at' => now()]);

        $url = "/api/error-bank/{$entry->id}/practice";

        $this->postJson($url, ['answer' => 'people thinks'])->assertJson(['correct' => false, 'status' => 'quarantined']);
        $this->postJson($url, ['answer' => 'People think.'])->assertStatus(422); // the revealed answer cannot be retyped today

        $this->travel(25)->hours();
        $this->postJson($url, ['answer' => 'People think.'])->assertJson(['correct' => true, 'status' => 'quarantined']);
        $this->postJson($url, ['answer' => 'people think'])->assertStatus(422); // two reviews need two separate days

        $this->travel(25)->hours();
        $this->postJson($url, ['answer' => 'people think'])->assertJson(['correct' => true, 'status' => 'cleared']);
    }

    public function test_finishing_a_writing_module_forces_a_rewrite_of_the_lowest_paragraph(): void
    {
        $this->completeFoundation();
        $this->complete('writing_t1_paraphrase', 'writing_t1_overview');

        $this->fakeClaude(['band' => 6, 'meetsStepGoal' => true, 'feedback' => 'x', 'paragraphs' => [
            ['text' => 'strong paragraph', 'band' => 7, 'revisionAdvice' => 'a'],
            ['text' => 'weak paragraph', 'band' => 5, 'revisionAdvice' => 'add figures'],
        ], 'errors' => []]);

        $this->postJson('/api/drills/writing_t1_grouping_drill/submit', ['text' => str_repeat('rent rose sharply while spending on books fell ', 8)])
            ->assertOk()->assertJson(['lessonCompleted' => true, 'rewriteCreated' => true]);

        $challenge = RewriteChallenge::first();
        $this->assertSame('weak paragraph', $challenge->original_paragraph);

        $this->getJson('/api/curriculum/lessons/writing_t2_unpacking')->assertStatus(423)->assertJson(['lockReason' => 'rewrite']);
        $this->getJson('/api/curriculum/lessons/reading_skimming')->assertStatus(423)->assertJson(['lockReason' => 'rewrite']);

        $this->fakeClaude(['band' => 5, 'improved' => false, 'feedback' => 'no'], ['band' => 6.5, 'improved' => true, 'feedback' => 'yes']);

        $url = "/api/rewrite-challenges/{$challenge->id}/submit";
        $this->postJson($url, ['rewritten' => 'A first attempt that does not apply the advice.'])->assertJson(['completed' => false]);
        $this->getJson('/api/curriculum/lessons/writing_t2_unpacking')->assertStatus(423);

        $this->postJson($url, ['rewritten' => 'A revised paragraph that applies the advice and adds figures.'])->assertJson(['completed' => true]);
        $this->getJson('/api/curriculum/lessons/writing_t2_unpacking')->assertOk();
    }

    public function test_adaptive_diagnostic_raises_difficulty_and_returns_a_band(): void
    {
        $questions = array_map(fn ($i) => ['id' => $i, 'type' => 'short', 'question' => "Q{$i}", 'options' => null], range(1, 5));
        $answers = ['1' => 'a', '2' => 'a', '3' => 'a', '4' => 'a', '5' => 'a'];
        $this->fakeClaude(['title' => 'T', 'text' => 'Text', 'questions' => $questions, 'answers' => $answers]);

        $first = $this->postJson('/api/drills/diagnostic_listening_test/start')->assertOk();
        $this->assertArrayNotHasKey('answers', $first->json('block'));
        $this->assertSame(6, $first->json('block.difficulty'));

        $url = '/api/drills/diagnostic_listening_test/next';

        $second = $this->postJson($url, ['responses' => $answers, 'blockIndex' => 0])->assertOk();
        $this->assertSame(7, $second->json('block.difficulty'));

        // A retry of block 0 returns the current block instead of grading it against block 1.
        $this->postJson($url, ['responses' => [], 'blockIndex' => 0])->assertOk()->assertJson(['blockIndex' => 1]);
        $this->assertSame(1, \App\Models\DrillAttempt::count());

        $third = $this->postJson($url, ['responses' => $answers, 'blockIndex' => 1])->assertOk();
        $this->assertSame(8, $third->json('block.difficulty'));

        // Estimates are 7, 8 and 9 for perfect blocks at 6, 7 and 8.
        $this->postJson($url, ['responses' => $answers, 'blockIndex' => 2])
            ->assertOk()->assertJson(['done' => true, 'band' => 8, 'lessonCompleted' => true]);

        $this->assertSame(8.0, DiagnosticResult::where('skill', 'listening')->first()->band);

        // A retry after the final block returns the stored result and leaves the band unchanged.
        $this->postJson($url, ['responses' => [], 'blockIndex' => 2])->assertOk()->assertJson(['done' => true, 'band' => 8]);
        $this->assertSame(8.0, DiagnosticResult::where('skill', 'listening')->first()->band);
    }

    private function examUnit(int $questions = 14): array
    {
        return [
            'title' => 'T', 'passage' => 'P', 'transcript' => 'S',
            'questions' => array_map(fn ($i) => ['id' => $i, 'type' => 'short', 'question' => "Q{$i}", 'options' => null], range(1, $questions)),
            'answers' => array_fill_keys(range(1, $questions), 'yes'),
            'task1' => ['prompt' => 'P', 'table' => ['caption' => 'C', 'headers' => ['a'], 'rows' => [['1']]]],
            'task2' => ['prompt' => 'P'],
        ];
    }

    private function unlockExam(): void
    {
        $this->completeFoundation();
        $this->complete(...CurriculumModule::where('phase', 2)->orderBy('sort_order')->take(8)->get()
            ->flatMap(fn ($m) => $m->lessons()->pluck('slug'))->all());
    }

    private function examAt(string $status, ?string $stage, array $attributes = []): ExamSimulation
    {
        $unit = $this->examUnit();

        return ExamSimulation::create($attributes + [
            'user_id' => $this->user->id, 'status' => $status, 'stage' => $stage,
            'stage_started_at' => $stage ? now() : null,
            'content' => ['listening' => [$unit], 'reading' => [$unit], 'writing' => [$unit]],
        ]);
    }

    public function test_incomplete_ai_content_is_rejected_and_never_pooled(): void
    {
        $this->unlockExam();
        $id = $this->postJson('/api/exam')->assertCreated()->json('id');

        $broken = $this->examUnit();
        unset($broken['answers']['3']);
        $this->fakeClaude($broken);

        $this->postJson("/api/exam/{$id}/prepare")->assertStatus(500);

        $this->assertSame(0, \App\Models\AiCache::count());
        $this->assertSame([], ExamSimulation::find($id)->content['listening'] ?? []);
    }

    public function test_a_stuck_exam_can_be_abandoned_and_a_new_one_started(): void
    {
        $this->unlockExam();
        $id = $this->postJson('/api/exam')->assertCreated()->json('id');

        $this->postJson("/api/exam/{$id}/abandon")->assertOk()->assertJson(['status' => 'abandoned']);

        $this->getJson('/api/exam')->assertJson(['active' => null]);
        $this->assertNotSame($id, $this->postJson('/api/exam')->assertCreated()->json('id'));
    }

    public function test_only_one_request_can_mark_a_paper(): void
    {
        $exam = $this->examAt('finalizing', null);
        $this->fakeClaude(['summary' => 'S']);

        $this->postJson("/api/exam/{$exam->id}/finalize")->assertOk()->assertJson(['status' => 'finalizing']);
        Http::assertNothingSent();
    }

    public function test_a_failed_marking_can_be_retried(): void
    {
        $exam = $this->examAt('evaluating', null);
        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::fake(['api.anthropic.com/*' => Http::response('overloaded', 529)]);

        $this->postJson("/api/exam/{$exam->id}/finalize")->assertStatus(500);

        $this->assertSame('evaluating', $exam->fresh()->status);
    }

    public function test_a_section_past_its_limit_closes_with_saved_answers_and_no_break(): void
    {
        $exam = $this->examAt('in_progress', 'listening');

        $this->postJson("/api/exam/{$exam->id}/save", ['stage' => 'listening', 'responses' => ['0-1' => 'yes']])->assertJson(['saved' => true]);

        $this->travel(1800 + 120)->seconds();

        // 120 seconds into the 3600-second Reading section, because Reading began when Listening ended.
        $state = $this->getJson('/api/exam')->assertOk()->json('active');
        $this->assertSame('reading', $state['stage']);
        $this->assertEqualsWithDelta(3480, $state['remainingSeconds'], 3);

        // Answers sent for the closed section are ignored; the saved copy stands.
        $this->postJson("/api/exam/{$exam->id}/stage", ['stage' => 'listening', 'responses' => ['0-1' => 'no', '0-2' => 'yes']])->assertJson(['stage' => 'reading']);
        $this->assertSame(['0-1' => 'yes'], $exam->fresh()->responses['listening']);
    }

    public function test_a_timed_passage_keeps_its_clock_across_reloads_and_rejects_late_answers(): void
    {
        $this->completeFoundation();
        $this->complete('reading_skimming', 'reading_scanning', 'reading_tfng', 'reading_ynng', 'reading_headings');
        $this->fakeClaude($this->examUnit(13));
        $url = '/api/drills/reading_paced_25_drill';

        $this->postJson("{$url}/start")->assertOk();
        $this->travel(600)->seconds();
        $this->assertEqualsWithDelta(900, $this->postJson("{$url}/start")->assertOk()->json('remainingSeconds'), 3);

        $this->travel(1200)->seconds();
        $answers = array_fill_keys(range(1, 13), 'yes');
        $this->postJson("{$url}/submit", ['responses' => $answers])->assertOk()->assertJson(['passed' => false, 'late' => true, 'correct' => 0]);
    }

    public function test_a_later_failed_retry_keeps_the_passed_state(): void
    {
        $this->completePlacement();
        $slug = 'foundation_standard_check';
        $this->postJson("/api/drills/{$slug}/submit", ['responses' => $this->correctAnswers($slug)])->assertJson(['passed' => true]);
        $this->postJson("/api/drills/{$slug}/submit", ['responses' => []])->assertJson(['passed' => false]);

        $this->getJson('/api/curriculum/lessons/foundation_academic_standard')->assertOk()->assertJsonPath('drills.0.passed', true);
    }

    public function test_recording_several_bands_writes_one_snapshot_and_keeps_a_zero(): void
    {
        app(\App\Services\StudyActivity::class)->recordBands($this->user, ['listening' => 8.0, 'reading' => 7.0, 'writing' => 0.0]);

        $this->assertSame(1, $this->user->progressSnapshots()->count());
        $this->assertEquals(5.0, $this->user->progressSnapshots()->first()->overall_band);
    }

    public function test_target_band_accepts_half_bands_only(): void
    {
        $this->putJson('/api/user/profile', ['target_band' => 6.5])->assertOk();
        $this->assertSame(6.5, $this->user->fresh()->target_band);
        $this->assertSame(6.5, $this->getJson('/api/curriculum')->assertOk()->json('baseline.targetBand'));

        $this->putJson('/api/user/profile', ['target_band' => 6.3])->assertStatus(422);
    }

    public function test_study_plan_counts_days_forward_from_the_start_date(): void
    {
        $this->user->update(['study_weeks' => 4, 'plan_start_date' => now()->subDays(5)->toDateString()]);

        $this->getJson('/api/study-plan')->assertOk()->assertJsonPath('plan.day_number', 6);
    }

    public function test_exam_is_locked_below_70_percent_and_runs_stages_in_order(): void
    {
        $this->completeFoundation();
        $this->postJson('/api/exam')->assertStatus(423);

        $slugs = CurriculumModule::where('phase', 2)->orderBy('sort_order')->take(8)->get()
            ->flatMap(fn ($m) => $m->lessons()->pluck('slug'))->all();
        $this->complete(...$slugs); // 8 of 11 modules = 72%

        $this->fakeClaude($this->examUnit());

        $id = $this->postJson('/api/exam')->assertCreated()->json('id');

        for ($i = 0; $i < 7; $i++) {
            $this->postJson("/api/exam/{$id}/prepare")->assertOk()->assertJson(['status' => 'preparing', 'prepared' => $i + 1]);
        }
        $listening = $this->postJson("/api/exam/{$id}/prepare")->assertOk()->assertJson(['status' => 'in_progress', 'stage' => 'listening']);
        $this->assertStringNotContainsString('answers', $listening->getContent());
        $this->assertEqualsWithDelta(1800, $listening->json('remainingSeconds'), 3);

        $allCorrect = [];
        foreach (range(0, 3) as $unitIndex) {
            foreach (range(1, 14) as $questionId) {
                $allCorrect["{$unitIndex}-{$questionId}"] = 'yes';
            }
        }

        $this->postJson("/api/exam/{$id}/stage", ['stage' => 'listening', 'responses' => $allCorrect])
            ->assertOk()->assertJson(['stage' => 'reading']);

        // A duplicate submit of the previous stage must not skip Reading.
        $this->postJson("/api/exam/{$id}/stage", ['stage' => 'listening', 'responses' => []])->assertJson(['stage' => 'reading']);

        $this->postJson("/api/exam/{$id}/stage", ['stage' => 'reading', 'responses' => ['0-1' => 'yes']])->assertOk()->assertJson(['stage' => 'writing']);

        $this->fakeClaude(['overallBand' => 6.5, 'highlights' => ['vocabularyToImprove' => [['original' => 'good', 'suggestion' => 'beneficial', 'reason' => 'r']], 'improvements' => []], 'summary' => 'S', 'strengths' => [], 'risks' => [], 'nextSteps' => []]);

        $essay = str_repeat('this essay has enough words to be evaluated ', 5);
        $this->postJson("/api/exam/{$id}/stage", ['stage' => 'writing', 'responses' => ['task1' => $essay, 'task2' => $essay]])
            ->assertOk()->assertJson(['status' => 'evaluating']);

        // Marking runs one Claude call per request (task 1, task 2, report); the page keeps calling.
        $this->postJson("/api/exam/{$id}/finalize")->assertOk()->assertJson(['status' => 'evaluating']);
        $this->postJson("/api/exam/{$id}/finalize")->assertOk()->assertJson(['status' => 'evaluating']);
        $done = $this->postJson("/api/exam/{$id}/finalize")->assertOk()->assertJson(['status' => 'completed']);
        Http::assertSentCount(3);
        $this->assertArrayNotHasKey('writingParts', ExamSimulation::find($id)->scores);

        $this->assertSame(9, (int) $done->json('scores.listening.band'));
        $this->assertSame(6.5, (float) $done->json('scores.writing.band'));
        $this->assertFalse($done->json('report.isStable'));
        $this->assertSame('completed', ExamSimulation::find($id)->status);
        $this->assertSame(1, ErrorLogEntry::where('original', 'good')->count());
    }

    public function test_band_scale_uses_official_rounding(): void
    {
        $this->assertSame(6.5, BandScale::roundHalf(6.25));
        $this->assertSame(6.0, BandScale::roundHalf(6.125));
        $this->assertSame(7.0, BandScale::roundHalf(6.75));
        $this->assertSame(7.0, BandScale::fromRaw('listening', 30));
        $this->assertSame(6.5, BandScale::fromRaw('reading', 27));
    }

    public function test_study_plan_uses_the_new_lesson_total_and_ignores_legacy_rows(): void
    {
        $this->user->update(['study_weeks' => 4, 'plan_start_date' => now()->toDateString()]);
        // One required lesson, one optional theory lesson and one legacy row: only the first counts.
        $this->complete('diagnostic_reading', 'foundation_academic_standard', 'reading_4');
        $optional = CurriculumLesson::whereHas('module', fn ($q) => $q->where('slug', 'foundation_standard'))->count();

        $this->assertGreaterThan(0, $optional);
        $this->getJson('/api/study-plan')->assertOk()->assertJson(['plan' => [
            'total_lessons'     => CurriculumLesson::count() - $optional,
            'completed_lessons' => 1,
        ]]);
    }
}
