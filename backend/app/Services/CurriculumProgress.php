<?php

namespace App\Services;

use App\Models\CurriculumDrill;
use App\Models\CurriculumLesson;
use App\Models\CurriculumModule;
use App\Models\CurriculumTrack;
use App\Models\DiagnosticResult;
use App\Models\DrillAttempt;
use App\Models\LessonCompletion;
use App\Models\RewriteChallenge;
use App\Models\User;

/** Works out what a learner has finished and which gates are open. */
class CurriculumProgress
{
    public const TRACK = 'academic';
    public const EXAM_THRESHOLD_PERCENT = 70;

    /** The only Phase 1 module learners must finish; the theory module is an optional review after the score. */
    private const PLACEMENT_MODULE = 'foundation_diagnostic';

    public function snapshot(User $user): array
    {
        $track = CurriculumTrack::where('slug', self::TRACK)
            ->with(['modules.lessons' => fn ($q) => $q->withCount('drills')])
            ->firstOrFail();

        $completed = LessonCompletion::where('user_id', $user->id)->pluck('lesson_id')->flip();
        $pending = RewriteChallenge::where('user_id', $user->id)->where('status', 'pending')->with('module')->first();

        $isDone = fn (CurriculumModule $m) => $m->lessons->every(fn ($l) => $completed->has($l->slug));
        $placementDone = $track->modules->where('slug', self::PLACEMENT_MODULE)->every($isDone);

        $previousBySkill = [];
        $modules = [];

        foreach ($track->modules as $module) {
            $done = $isDone($module);
            $previous = $previousBySkill[$module->skill] ?? null;

            $lock = match (true) {
                $done => null,
                $pending && $pending->module_id !== $module->id => 'rewrite',
                $module->slug !== self::PLACEMENT_MODULE && !$placementDone => 'diagnostic',
                $previous && !$isDone($previous) => 'previous_module',
                default => null,
            };

            $lessons = [];
            $previousLessonDone = true;
            foreach ($module->lessons as $lesson) {
                $lessonDone = $completed->has($lesson->slug);
                $lessonLock = $lessonDone ? null : ($lock ?? ($previousLessonDone ? null : 'previous_lesson'));
                $lessons[] = [
                    'slug'        => $lesson->slug,
                    'title'       => $lesson->title,
                    'description' => $lesson->description,
                    'duration'    => $lesson->duration_minutes,
                    'drillCount'  => $lesson->drills_count,
                    'status'      => $lessonDone ? 'completed' : ($lessonLock ? 'locked' : 'available'),
                    'lockReason'  => $lessonLock,
                ];
                $previousLessonDone = $lessonDone;
            }

            $modules[] = [
                'slug'        => $module->slug,
                'phase'       => $module->phase,
                'skill'       => $module->skill,
                'title'       => $module->title,
                'description' => $module->description,
                'status'      => $done ? 'completed' : ($lock ? 'locked' : 'available'),
                'lockReason'  => $lock,
                'optional'    => $module->phase === 1 && $module->slug !== self::PLACEMENT_MODULE,
                'lessons'     => $lessons,
            ];

            $previousBySkill[$module->skill] = $module;
        }

        $component = collect($modules)->where('phase', 2);
        $doneCount = $component->where('status', 'completed')->count();
        $percent = $component->count() ? (int) floor($doneCount / $component->count() * 100) : 0;

        return [
            'track'   => $track->only(['slug', 'title', 'description']),
            'phases'  => $track->phases,
            'modules' => $modules,
            'gates'   => [
                'placementComplete'  => $placementDone,
                'components'         => ['completed' => $doneCount, 'total' => $component->count(), 'percent' => $percent, 'required' => self::EXAM_THRESHOLD_PERCENT],
                'examUnlocked'       => $percent >= self::EXAM_THRESHOLD_PERCENT && !$pending,
                'pendingRewrite'     => $pending ? ['id' => $pending->id, 'moduleTitle' => $pending->module->title] : null,
            ],
            'baseline' => [
                'bands'      => DiagnosticResult::where('user_id', $user->id)->pluck('band', 'skill'),
                'targetBand' => $user->target_band !== null ? (float) $user->target_band : null,
                'skillMinimums' => (object) ($user->skill_minimums ?? []),
            ],
        ];
    }

    /** Lessons a learner must finish. The optional Phase 1 theory review is left out of plan pacing. */
    private function requiredLessons()
    {
        return CurriculumLesson::whereHas('module', fn ($q) => $q->where('phase', '!=', 1)->orWhere('slug', self::PLACEMENT_MODULE));
    }

    public function totalLessons(): int
    {
        return $this->requiredLessons()->count();
    }

    /** Only required lessons in the current structure count, so legacy rows left in lesson_completions are ignored. */
    public function completedLessons(User $user): int
    {
        return LessonCompletion::where('user_id', $user->id)
            ->whereIn('lesson_id', $this->requiredLessons()->select('slug'))
            ->count();
    }

    /**
     * Lock reasons for every lesson, keyed by slug, from one snapshot. Callers that check several
     * lessons use this instead of calling lessonLockReason() in a loop, since each snapshot is several queries.
     */
    public function lockReasons(User $user): array
    {
        $reasons = [];
        foreach ($this->snapshot($user)['modules'] as $module) {
            foreach ($module['lessons'] as $item) {
                $reasons[$item['slug']] = $item['lockReason'];
            }
        }
        return $reasons;
    }

    public function lessonLockReason(User $user, CurriculumLesson $lesson): ?string
    {
        $reasons = $this->lockReasons($user);
        return array_key_exists($lesson->slug, $reasons) ? $reasons[$lesson->slug] : 'previous_lesson';
    }

    /** Call after a passing attempt. Returns the lesson-completion and rewrite outcome for the response. */
    public function afterPass(User $user, CurriculumDrill $drill): array
    {
        $lesson = $drill->lesson;
        $drillIds = $lesson->drills()->pluck('id');

        $passed = DrillAttempt::where('user_id', $user->id)
            ->whereIn('drill_id', $drillIds)
            ->where('passed', true)
            ->distinct()
            ->count('drill_id');

        if ($passed < $drillIds->count()) {
            return ['lessonCompleted' => false, 'rewriteCreated' => false];
        }

        LessonCompletion::firstOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->slug],
            ['completed_at' => now()]
        );

        return ['lessonCompleted' => true, 'rewriteCreated' => $this->maybeCreateRewrite($user, $lesson->module)];
    }

    /** Phase 3 Rewrite Challenge: the lowest-scoring paragraph in a finished module must be rewritten. */
    private function maybeCreateRewrite(User $user, CurriculumModule $module): bool
    {
        if (!$module->requires_rewrite) return false;

        $slugs = $module->lessons()->pluck('slug');
        $done = LessonCompletion::where('user_id', $user->id)->whereIn('lesson_id', $slugs)->count();
        if ($done < $slugs->count()) return false;

        if (RewriteChallenge::where('user_id', $user->id)->where('module_id', $module->id)->exists()) return false;

        $attempts = DrillAttempt::where('user_id', $user->id)
            ->where('passed', true)
            ->whereIn('drill_id', CurriculumDrill::whereIn('lesson_id', $module->lessons()->select('id'))->select('id'))
            ->get();

        $lowest = null;
        foreach ($attempts as $attempt) {
            foreach ($attempt->evaluation['paragraphs'] ?? [] as $paragraph) {
                if (!isset($paragraph['band'], $paragraph['text'])) continue;
                if ($lowest === null || $paragraph['band'] < $lowest['band']) {
                    $lowest = $paragraph + ['attemptId' => $attempt->id];
                }
            }
        }

        if ($lowest === null) return false;

        RewriteChallenge::create([
            'user_id'            => $user->id,
            'module_id'          => $module->id,
            'drill_attempt_id'   => $lowest['attemptId'],
            'original_paragraph' => $lowest['text'],
            'original_band'      => $lowest['band'],
            'revision_advice'    => $lowest['revisionAdvice'] ?? 'Improve the clarity, grammar and academic tone of this paragraph.',
        ]);

        return true;
    }
}
