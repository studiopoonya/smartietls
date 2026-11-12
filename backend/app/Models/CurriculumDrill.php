<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CurriculumDrill extends Model
{
    protected $fillable = ['lesson_id', 'slug', 'type', 'evaluator', 'title', 'instructions', 'payload', 'answer_key', 'sort_order'];

    protected $hidden = ['answer_key'];

    protected function casts(): array
    {
        return ['payload' => 'array', 'answer_key' => 'array'];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(CurriculumLesson::class, 'lesson_id');
    }
}
