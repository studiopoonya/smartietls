<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_cache', function (Blueprint $table) {
            $table->id();
            $table->string('type', 30);       // 'listening' | 'reading'
            $table->string('cache_key', 100); // e.g. "section:2:diff:6"
            $table->json('data');
            $table->timestamps();
            $table->index(['type', 'cache_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_cache');
    }
};
