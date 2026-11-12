<?php

namespace Database\Seeders;

use App\Models\CurriculumDrill;
use App\Models\CurriculumLesson;
use App\Models\CurriculumModule;
use App\Models\CurriculumTrack;
use Illuminate\Database\Seeder;

/**
 * Syncs the course content in data/curriculum_academic.php into the database.
 * Safe to run on every deploy: rows are matched by slug. Rows removed from the file are
 * not deleted, because that would cascade into learner attempts.
 */
class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        $data = require __DIR__ . '/data/curriculum_academic.php';

        $track = CurriculumTrack::updateOrCreate(['slug' => $data['slug']], [
            'title'       => $data['title'],
            'description' => $data['description'],
            'phases'      => $data['phases'],
        ]);

        foreach ($data['modules'] as $moduleOrder => $module) {
            $moduleRow = CurriculumModule::updateOrCreate(['slug' => $module['slug']], [
                'track_id'         => $track->id,
                'phase'            => $module['phase'],
                'skill'            => $module['skill'],
                'title'            => $module['title'],
                'description'      => $module['description'],
                'requires_rewrite' => $module['requires_rewrite'] ?? false,
                'sort_order'       => $moduleOrder,
            ]);

            foreach ($module['lessons'] as $lessonOrder => $lesson) {
                $lessonRow = CurriculumLesson::updateOrCreate(['slug' => $lesson['slug']], [
                    'module_id'        => $moduleRow->id,
                    'title'            => $lesson['title'],
                    'description'      => $lesson['description'],
                    'duration_minutes' => $lesson['duration'],
                    'content'          => ['theory' => $lesson['theory'] ?? [], 'keyTakeaways' => $lesson['takeaways'] ?? []],
                    'sort_order'       => $lessonOrder,
                ]);

                foreach ($lesson['drills'] as $drillOrder => $drill) {
                    CurriculumDrill::updateOrCreate(['slug' => $drill['slug']], [
                        'lesson_id'    => $lessonRow->id,
                        'type'         => $drill['type'],
                        'evaluator'    => in_array($drill['type'], ['ai_writing', 'ai_speaking'], true) ? 'claude' : 'answer_key',
                        'title'        => $drill['title'],
                        'instructions' => $drill['instructions'],
                        'payload'      => $this->publicPayload($drill),
                        'answer_key'   => $this->answerKey($drill),
                        'sort_order'   => $drillOrder,
                    ]);
                }
            }
        }
    }

    private function publicPayload(array $drill): array
    {
        $payload = $drill['payload'] ?? [];

        if (isset($payload['questions'])) {
            $payload['questions'] = array_map(fn ($q) => [
                'id'       => $q['id'],
                'question' => $q['question'],
                'options'  => $q['options'] ?? null,
            ], $payload['questions']);
        }

        return $payload;
    }

    private function answerKey(array $drill): ?array
    {
        if (isset($drill['rubric'])) {
            return ['rubric' => $drill['rubric']];
        }

        if ($drill['type'] !== 'quiz') {
            return null;
        }

        $questions = [];
        foreach ($drill['payload']['questions'] as $q) {
            $questions[(string) $q['id']] = ['answer' => $q['answer'], 'explain' => $q['explain'] ?? null];
        }

        return ['questions' => $questions];
    }
}
