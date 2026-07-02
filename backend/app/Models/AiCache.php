<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiCache extends Model
{
    protected $table = 'ai_cache';

    protected $fillable = ['type', 'cache_key', 'data'];

    protected function casts(): array
    {
        return ['data' => 'array'];
    }

    public static function getCached(string $type, string $key): ?array
    {
        $row = self::where('type', $type)->where('cache_key', $key)
            ->inRandomOrder()->first();
        return $row?->data;
    }

    public static function putCache(string $type, string $key, array $data, int $max = 8): void
    {
        $count = self::where('type', $type)->where('cache_key', $key)->count();
        if ($count >= $max) return;
        self::create(['type' => $type, 'cache_key' => $key, 'data' => $data]);
    }
}
