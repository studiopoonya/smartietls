<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('anthropic_api_key')->nullable()->after('password');
            $table->integer('target_band')->default(7)->after('anthropic_api_key');
            $table->integer('streak_days')->default(0)->after('target_band');
            $table->date('last_active_date')->nullable()->after('streak_days');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['anthropic_api_key', 'target_band', 'streak_days', 'last_active_date']);
        });
    }
};
