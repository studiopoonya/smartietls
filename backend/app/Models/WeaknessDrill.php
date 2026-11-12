<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeaknessDrill extends Model
{
    protected $fillable = ['user_id', 'skill', 'weakness', 'content', 'responses', 'correct', 'total', 'submitted_at'];

    protected function casts(): array
    {
        return [
            'content'      => 'array',
            'responses'    => 'array',
            'submitted_at' => 'datetime',
        ];
    }
}
