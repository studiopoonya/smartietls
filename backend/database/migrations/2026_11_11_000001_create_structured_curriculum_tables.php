<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Old flat lesson id => equivalent lesson in the new structure, so existing progress carries over. */
    private const LESSON_ID_MAP = [
        'reading_1'   => 'reading_skimming',
        'reading_2'   => 'reading_tfng',
        'reading_3'   => 'reading_headings',
        'listening_1' => 'listening_prediction',
        'listening_3' => 'listening_signposting',
        'listening_5' => 'listening_self_correction',
        'writing_1'   => 'writing_t1_overview',
        'writing_3'   => 'writing_t2_peel',
        'writing_4'   => 'writing_t2_unpacking',
        'speaking_1'  => 'speaking_p1_crisp',
        'speaking_2'  => 'speaking_p2_prep',
        'speaking_3'  => 'speaking_p3_extender',
    ];

    public function up(): void
    {
        // Content hierarchy: Track > Module > Lesson > Drill
        Schema::create('curriculum_tracks', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description');
            $table->json('phases');
            $table->timestamps();
        });

        Schema::create('curriculum_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('track_id')->constrained('curriculum_tracks')->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->unsignedTinyInteger('phase');
            $table->string('skill', 20); // foundation | reading | listening | writing | speaking
            $table->string('title');
            $table->text('description');
            $table->boolean('requires_rewrite')->default(false);
            $table->unsignedSmallInteger('sort_order');
            $table->timestamps();
        });

        Schema::create('curriculum_lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('curriculum_modules')->cascadeOnDelete();
            $table->string('slug')->unique(); // stored as lesson_completions.lesson_id
            $table->string('title');
            $table->text('description');
            $table->unsignedSmallInteger('duration_minutes');
            $table->json('content'); // theory sections + key takeaways
            $table->unsignedSmallInteger('sort_order');
            $table->timestamps();
        });

        Schema::create('curriculum_drills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained('curriculum_lessons')->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('type', 30);      // quiz | timed_passage | adaptive_quiz | ai_writing | ai_speaking
            $table->string('evaluator', 20); // answer_key | claude: the evaluation trigger
            $table->string('title');
            $table->text('instructions');
            $table->json('payload');              // sent to the learner
            $table->json('answer_key')->nullable(); // server-only: answers or the Claude rubric
            $table->unsignedSmallInteger('sort_order');
            $table->timestamps();
        });

        // Learner state
        Schema::create('drill_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('drill_id')->constrained('curriculum_drills')->cascadeOnDelete();
            $table->json('generated')->nullable(); // AI-generated content including its answers
            $table->json('response')->nullable();
            $table->json('evaluation')->nullable();
            $table->decimal('score', 5, 2)->nullable(); // percent for answer-key drills, band for Claude drills
            $table->boolean('passed')->default(false);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'drill_id']);
        });

        Schema::create('error_log_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('drill_attempt_id')->nullable()->constrained()->nullOnDelete();
            $table->string('skill', 20);
            $table->string('category', 30); // grammar | collocation | vocabulary | low_value_sentence | reading_logic | listening_trap
            $table->char('fingerprint', 40);
            $table->text('original');
            $table->text('correction');
            $table->text('explanation')->nullable();
            $table->string('status', 20); // quarantined | cleared | logged
            $table->unsignedInteger('occurrences')->default(1);
            $table->unsignedTinyInteger('correct_reviews')->default(0);
            $table->timestamp('next_review_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'fingerprint']);
            $table->index(['user_id', 'status', 'next_review_at']);
        });

        Schema::create('rewrite_challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('curriculum_modules')->cascadeOnDelete();
            $table->foreignId('drill_attempt_id')->nullable()->constrained()->nullOnDelete();
            $table->text('original_paragraph');
            $table->decimal('original_band', 3, 1);
            $table->text('revision_advice');
            $table->text('rewritten')->nullable();
            $table->decimal('rewritten_band', 3, 1)->nullable();
            $table->text('feedback')->nullable();
            $table->string('status', 20)->default('pending'); // pending | completed
            $table->timestamps();
            $table->unique(['user_id', 'module_id']);
        });

        Schema::create('diagnostic_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('skill', 20);
            $table->decimal('band', 3, 1);
            $table->timestamps();
            $table->unique(['user_id', 'skill']);
        });

        Schema::create('exam_simulations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20); // preparing | in_progress | evaluating | completed
            $table->string('stage', 20)->nullable(); // listening | reading | writing
            $table->timestamp('stage_started_at')->nullable();
            $table->longText('content')->nullable(); // JSON, includes answer keys
            $table->json('responses')->nullable();
            $table->json('scores')->nullable();
            $table->json('report')->nullable();
            $table->decimal('overall_band', 3, 1)->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });

        foreach (self::LESSON_ID_MAP as $old => $new) {
            DB::table('lesson_completions')->where('lesson_id', $old)->update(['lesson_id' => $new]);
        }
    }

    public function down(): void
    {
        foreach (self::LESSON_ID_MAP as $old => $new) {
            DB::table('lesson_completions')->where('lesson_id', $new)->update(['lesson_id' => $old]);
        }

        Schema::dropIfExists('exam_simulations');
        Schema::dropIfExists('diagnostic_results');
        Schema::dropIfExists('rewrite_challenges');
        Schema::dropIfExists('error_log_entries');
        Schema::dropIfExists('drill_attempts');
        Schema::dropIfExists('curriculum_drills');
        Schema::dropIfExists('curriculum_lessons');
        Schema::dropIfExists('curriculum_modules');
        Schema::dropIfExists('curriculum_tracks');
    }
};
