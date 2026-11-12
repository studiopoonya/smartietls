<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CurriculumLesson extends Model
{
    protected $fillable = ['module_id', 'slug', 'title', 'description', 'duration_minutes', 'content', 'sort_order'];

    protected function casts(): array
    {
        return ['content' => 'array'];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(CurriculumModule::class, 'module_id');
    }

    public function drills(): HasMany
    {
        return $this->hasMany(CurriculumDrill::class, 'lesson_id')->orderBy('sort_order');
    }
}
