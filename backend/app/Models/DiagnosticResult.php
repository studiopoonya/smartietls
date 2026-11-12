<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiagnosticResult extends Model
{
    protected $fillable = ['user_id', 'skill', 'band'];

    protected function casts(): array
    {
        return ['band' => 'float'];
    }
}
