<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearningSession extends Model
{
    protected $fillable = [
        'user_id',
        'module',
        'input_data',
        'ai_feedback',
        'band_score',
        'duration_seconds',
    ];

    protected function casts(): array
    {
        return [
            'input_data' => 'array',
            'ai_feedback' => 'array',
            'band_score' => 'decimal:1',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
