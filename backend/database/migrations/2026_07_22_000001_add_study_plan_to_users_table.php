<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedTinyInteger('study_weeks')->nullable()->after('exam_date'); // 2, 4, or 8
            $table->date('plan_start_date')->nullable()->after('study_weeks');
            $table->string('reminder_time', 5)->nullable()->default('08:00')->after('plan_start_date');
            $table->boolean('reminder_enabled')->default(false)->after('reminder_time');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['study_weeks', 'plan_start_date', 'reminder_time', 'reminder_enabled']);
        });
    }
};
