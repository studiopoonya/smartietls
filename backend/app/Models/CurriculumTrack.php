<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CurriculumTrack extends Model
{
    protected $fillable = ['slug', 'title', 'description', 'phases'];

    protected function casts(): array
    {
        return ['phases' => 'array'];
    }

    public function modules(): HasMany
    {
        return $this->hasMany(CurriculumModule::class, 'track_id')->orderBy('sort_order');
    }
}
