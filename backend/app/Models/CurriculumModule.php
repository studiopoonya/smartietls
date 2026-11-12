<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CurriculumModule extends Model
{
    protected $fillable = ['track_id', 'slug', 'phase', 'skill', 'title', 'description', 'requires_rewrite', 'sort_order'];

    protected function casts(): array
    {
        return ['requires_rewrite' => 'boolean'];
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(CurriculumLesson::class, 'module_id')->orderBy('sort_order');
    }
}
