<?php

namespace App\Console\Commands;

use App\Mail\StudyReminderMail;
use App\Models\User;
use App\Services\CurriculumProgress;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendStudyReminders extends Command
{
    protected $signature   = 'reminders:send';
    protected $description = 'Send daily study reminder emails to users whose reminder time matches now';

    public function handle(CurriculumProgress $progress): void
    {
        $now = now()->format('H:i');

        $users = User::where('reminder_enabled', true)
            ->where('reminder_time', $now)
            ->whereNotNull('study_weeks')
            ->whereNotNull('plan_start_date')
            ->get();

        $total = $progress->totalLessons();

        foreach ($users as $user) {
            $completed = $progress->completedLessons($user);
            $totalDays = $user->study_weeks * 7;
            $dayNumber = (int) $user->plan_start_date->diffInDays(now(), true) + 1;
            $dayNumber = min($dayNumber, $totalDays);
            $expected  = (int) ceil($total * $dayNumber / $totalDays);

            $plan = [
                'day_number'        => $dayNumber,
                'total_days'        => $totalDays,
                'completed_lessons' => $completed,
                'expected_lessons'  => min($expected, $total),
                'total_lessons'     => $total,
                'on_track'          => $completed >= $expected,
            ];

            Mail::to($user->email)->send(new StudyReminderMail($user, $plan));

            $this->info("Sent reminder to {$user->email}");
        }

        $this->info("Done. Sent to {$users->count()} user(s).");
    }
}
