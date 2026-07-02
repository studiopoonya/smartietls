<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('progress_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('overall_band', 3, 1);
            $table->decimal('writing_band', 3, 1)->nullable();
            $table->decimal('speaking_band', 3, 1)->nullable();
            $table->decimal('reading_band', 3, 1)->nullable();
            $table->decimal('listening_band', 3, 1)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('progress_snapshots');
    }
};
