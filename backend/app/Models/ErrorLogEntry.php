<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ErrorLogEntry extends Model
{
    protected $fillable = [
        'user_id', 'drill_attempt_id', 'skill', 'category', 'weakness', 'fingerprint', 'original', 'correction',
        'explanation', 'status', 'occurrences', 'correct_reviews', 'next_review_at',
    ];

    protected function casts(): array
    {
        return ['next_review_at' => 'datetime'];
    }
}
