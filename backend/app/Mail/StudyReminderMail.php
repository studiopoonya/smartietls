<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudyReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public array $plan
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address('neobrigdehitect@gmail.com', 'Admin Smart IELTS'),
            subject: '📚 Daily IELTS Reminder — Day ' . $this->plan['day_number'] . ' of ' . $this->plan['total_days'],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.study_reminder',
        );
    }
}
