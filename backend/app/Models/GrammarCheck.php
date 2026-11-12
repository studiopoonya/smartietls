<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GrammarCheck extends Model
{
    protected $fillable = ['user_id', 'topic', 'language', 'text', 'result', 'error_count'];

    protected function casts(): array
    {
        return ['result' => 'array'];
    }
}
