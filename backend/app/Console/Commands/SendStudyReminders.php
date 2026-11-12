<?php

namespace App\Console\Commands;

use App\Http\Controllers\StudyPlanController;
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
        // The server runs on UTC, but a learner who picks 08:00 means 08:00 where they live.
        $base = User::where('reminder_enabled', true)->whereNotNull('study_weeks')->whereNotNull('plan_start_date');
        $users = collect();

        foreach ((clone $base)->distinct()->pluck('timezone') as $timezone) {
            $zone = $timezone && in_array($timezone, timezone_identifiers_list(\DateTimeZone::ALL_WITH_BC), true) ? $timezone : StudyPlanController::DEFAULT_TIMEZONE;
            $localTime = now($zone)->format('H:i');

            $users = $users->merge(
                (clone $base)
                    ->where(fn ($q) => $timezone === null ? $q->whereNull('timezone') : $q->where('timezone', $timezone))
                    ->where('reminder_time', $localTime)
                    ->get()
            );
        }

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

            // One bad address or a mail-server hiccup must not stop everyone else's reminder.
            try {
                Mail::to($user->email)->send(new StudyReminderMail($user, $plan));
                $this->info("Sent reminder to user #{$user->id}");
            } catch (\Throwable $e) {
                report($e);
                $this->error("Could not send reminder to user #{$user->id}");
            }
        }

        $this->info("Done. Sent to {$users->count()} user(s).");
    }
}
