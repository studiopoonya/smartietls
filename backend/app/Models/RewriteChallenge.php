<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RewriteChallenge extends Model
{
    protected $fillable = [
        'user_id', 'module_id', 'drill_attempt_id', 'original_paragraph', 'original_band',
        'revision_advice', 'rewritten', 'rewritten_band', 'feedback', 'status',
    ];

    protected function casts(): array
    {
        return ['original_band' => 'float', 'rewritten_band' => 'float'];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(CurriculumModule::class, 'module_id');
    }
}
