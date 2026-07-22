<?php

namespace App\Console\Commands;

use App\Mail\StudyReminderMail;
use App\Models\LessonCompletion;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendStudyReminders extends Command
{
    protected $signature   = 'reminders:send';
    protected $description = 'Send daily study reminder emails to users whose reminder time matches now';

    private const TOTAL_LESSONS = 20;

    public function handle(): void
    {
        $now = now()->format('H:i');

        $users = User::where('reminder_enabled', true)
            ->where('reminder_time', $now)
            ->whereNotNull('study_weeks')
            ->whereNotNull('plan_start_date')
            ->get();

        foreach ($users as $user) {
            $completed = LessonCompletion::where('user_id', $user->id)->count();
            $totalDays = $user->study_weeks * 7;
            $dayNumber = (int) now()->diffInDays($user->plan_start_date) + 1;
            $dayNumber = min($dayNumber, $totalDays);
            $expected  = (int) ceil(self::TOTAL_LESSONS * $dayNumber / $totalDays);

            $plan = [
                'day_number'        => $dayNumber,
                'total_days'        => $totalDays,
                'completed_lessons' => $completed,
                'expected_lessons'  => min($expected, self::TOTAL_LESSONS),
                'total_lessons'     => self::TOTAL_LESSONS,
                'on_track'          => $completed >= $expected,
            ];

            Mail::to($user->email)->send(new StudyReminderMail($user, $plan));

            $this->info("Sent reminder to {$user->email}");
        }

        $this->info("Done. Sent to {$users->count()} user(s).");
    }
}
