<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('error_log_entries', function (Blueprint $table) {
            $table->string('weakness', 40)->nullable()->after('category');
        });

        Schema::create('weakness_drills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('skill', 20);
            $table->string('weakness', 40);
            $table->json('content');
            $table->json('responses')->nullable();
            $table->unsignedTinyInteger('correct')->nullable();
            $table->unsignedTinyInteger('total')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weakness_drills');

        Schema::table('error_log_entries', function (Blueprint $table) {
            $table->dropColumn('weakness');
        });
    }
};
