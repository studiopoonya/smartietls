<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamSimulation extends Model
{
    protected $fillable = ['user_id', 'status', 'stage', 'stage_started_at', 'content', 'responses', 'scores', 'report', 'overall_band'];

    protected function casts(): array
    {
        return [
            'stage_started_at' => 'datetime',
            'content'          => 'array',
            'responses'        => 'array',
            'scores'           => 'array',
            'report'           => 'array',
            'overall_band'     => 'float',
        ];
    }
}
