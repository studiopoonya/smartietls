<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgressSnapshot extends Model
{
    protected $fillable = [
        'user_id',
        'overall_band',
        'writing_band',
        'speaking_band',
        'reading_band',
        'listening_band',
    ];

    protected function casts(): array
    {
        return [
            'overall_band' => 'decimal:1',
            'writing_band' => 'decimal:1',
            'speaking_band' => 'decimal:1',
            'reading_band' => 'decimal:1',
            'listening_band' => 'decimal:1',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
