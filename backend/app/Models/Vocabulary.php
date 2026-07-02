<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vocabulary extends Model
{
    protected $fillable = [
        'user_id',
        'word',
        'definition_data',
        'review_count',
        'next_review_at',
    ];

    protected function casts(): array
    {
        return [
            'definition_data' => 'array',
            'next_review_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
