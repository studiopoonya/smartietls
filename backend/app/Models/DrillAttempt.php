<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrillAttempt extends Model
{
    protected $fillable = ['user_id', 'drill_id', 'generated', 'response', 'evaluation', 'score', 'passed', 'submitted_at'];

    protected function casts(): array
    {
        return [
            'generated'    => 'array',
            'response'     => 'array',
            'evaluation'   => 'array',
            'score'        => 'float',
            'passed'       => 'boolean',
            'submitted_at' => 'datetime',
        ];
    }

    public function drill(): BelongsTo
    {
        return $this->belongsTo(CurriculumDrill::class, 'drill_id');
    }
}
