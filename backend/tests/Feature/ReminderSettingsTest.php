<?php

namespace Tests\Feature;

use App\Mail\StudyReminderMail;
use App\Models\User;
use Database\Seeders\CurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReminderSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CurriculumSeeder::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function learner(array $attributes = []): User
    {
        return User::factory()->create($attributes + [
            'study_weeks' => 4, 'plan_start_date' => now()->subDays(5)->toDateString(),
            'reminder_enabled' => true, 'reminder_time' => '08:00',
        ]);
    }

    public function test_changing_the_reminder_keeps_the_study_plan(): void
    {
        $user = $this->learner(['reminder_enabled' => false]);
        $start = $user->plan_start_date->toDateString();
        Sanctum::actingAs($user);

        $this->putJson('/api/study-plan/reminder', ['reminder_enabled' => true, 'reminder_time' => '19:30', 'timezone' => 'Asia/Makassar'])
            ->assertOk()
            ->assertJson(['reminder_enabled' => true, 'reminder_time' => '19:30', 'timezone' => 'Asia/Makassar']);

        $user->refresh();
        $this->assertSame($start, $user->plan_start_date->toDateString(), 'The plan must not restart.');
        $this->getJson('/api/study-plan')->assertJsonPath('plan.day_number', 6)->assertJsonPath('plan.reminder_time', '19:30');

        $this->putJson('/api/study-plan/reminder', ['reminder_enabled' => true, 'reminder_time' => '25:00'])->assertStatus(422);
        $this->putJson('/api/study-plan/reminder', ['reminder_enabled' => true, 'reminder_time' => '08:00', 'timezone' => 'Mars/Base'])->assertStatus(422);
    }

    public function test_reminders_go_out_at_the_learners_local_time(): void
    {
        Mail::fake();
        $jakarta = $this->learner(['timezone' => 'Asia/Jakarta']);   // UTC+7
        $makassar = $this->learner(['timezone' => 'Asia/Makassar']); // UTC+8
        $noZone = $this->learner(['timezone' => null]);              // treated as Jakarta
        $this->learner(['timezone' => 'Asia/Jakarta', 'reminder_enabled' => false]);

        // 01:00 UTC is 08:00 in Jakarta and 09:00 in Makassar.
        Carbon::setTestNow(Carbon::parse('2026-11-12 01:00:00', 'UTC'));
        $this->artisan('reminders:send')->assertSuccessful();

        Mail::assertSent(StudyReminderMail::class, 2);
        Mail::assertSent(StudyReminderMail::class, fn ($mail) => $mail->hasTo($jakarta->email));
        Mail::assertSent(StudyReminderMail::class, fn ($mail) => $mail->hasTo($noZone->email));
        Mail::assertNotSent(StudyReminderMail::class, fn ($mail) => $mail->hasTo($makassar->email));

        // 00:00 UTC is 08:00 in Makassar.
        Mail::fake();
        Carbon::setTestNow(Carbon::parse('2026-11-12 00:00:00', 'UTC'));
        $this->artisan('reminders:send')->assertSuccessful();
        Mail::assertSent(StudyReminderMail::class, 1);
        Mail::assertSent(StudyReminderMail::class, fn ($mail) => $mail->hasTo($makassar->email));
    }
}
