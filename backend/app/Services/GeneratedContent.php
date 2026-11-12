<?php

namespace App\Services;

use RuntimeException;

/** Rejects incomplete AI output before it is shown to a learner or added to a shared pool. */
class GeneratedContent
{
    public static function assertQuestionUnit(array $unit, string $textKey, int $minQuestions): void
    {
        self::requireText($unit[$textKey] ?? null);

        $questions = $unit['questions'] ?? null;
        if (!is_array($questions) || count($questions) < $minQuestions) self::reject();

        $answers = $unit['answers'] ?? null;
        if (!is_array($answers)) self::reject();

        foreach ($questions as $question) {
            if (!is_array($question) || !isset($question['id'])) self::reject();
            self::requireText($question['question'] ?? null);

            $options = $question['options'] ?? null;
            if ($options !== null && (!is_array($options) || $options === [])) self::reject();

            $answer = $answers[$question['id']] ?? null;
            if (!is_scalar($answer) || trim((string) $answer) === '') self::reject();
        }
    }

    public static function assertWritingPaper(array $paper): void
    {
        self::requireText($paper['task1']['prompt'] ?? null);
        self::requireText($paper['task2']['prompt'] ?? null);

        $table = $paper['task1']['table'] ?? null;
        if (!is_array($table) || empty($table['headers']) || !is_array($table['headers']) || empty($table['rows']) || !is_array($table['rows'])) {
            self::reject();
        }
    }

    private static function requireText(mixed $value): void
    {
        if (!is_string($value) || trim($value) === '') self::reject();
    }

    private static function reject(): never
    {
        throw new RuntimeException('The AI returned incomplete content. Please try again.');
    }
}
