<?php

namespace App\Services;

/**
 * The fixed list of weaknesses an error can be filed under. Claude must pick from this list,
 * so errors group cleanly and each group can be targeted with practice.
 */
class Weakness
{
    /** Shared by writing and speaking. Keep in sync with the list in Prompts::WEAKNESS_LIST. */
    public const LANGUAGE = [
        'subject_verb_agreement' => 'Subject–verb agreement',
        'verb_tense'             => 'Verb tenses',
        'articles'               => 'Articles (a / an / the)',
        'plurals_countability'   => 'Plurals & countable nouns',
        'prepositions'           => 'Prepositions',
        'sentence_structure'     => 'Sentence structure',
        'word_form'              => 'Word form (noun / verb / adjective)',
        'collocation'            => 'Collocations',
        'word_choice'            => 'Word choice & academic register',
        'linking'                => 'Linking words & cohesion',
        'low_value'              => 'Vague or low-value sentences',
        'other_grammar'          => 'Other grammar',
    ];

    public const READING = [
        'false_vs_not_given' => 'FALSE vs NOT GIVEN',
        'writer_views'       => "Writer's views (YES / NO / NOT GIVEN)",
        'headings'           => 'Main idea vs detail (headings)',
        'paraphrase'         => 'Paraphrased keywords',
        'scanning_detail'    => 'Locating specific details',
    ];

    public const LISTENING = [
        'self_correction'  => 'Speaker corrections & distractors',
        'synonyms'         => 'Paraphrase & synonyms',
        'spelling_numbers' => 'Spelling, numbers & plural endings',
        'signposting'      => 'Following the lecture structure',
        'detail'           => 'Catching specific details',
    ];

    private const FIX_LESSONS = [
        'writing' => [
            'sentence_structure' => 'writing_t2_peel',
            'low_value'          => 'writing_t2_peel',
            'collocation'        => 'writing_t2_tone',
            'word_choice'        => 'writing_t2_tone',
            'linking'            => 'writing_t2_tone',
        ],
        'speaking' => [
            'low_value' => 'speaking_p3_extender',
            'linking'   => 'speaking_p3_extender',
        ],
        'reading' => [
            'false_vs_not_given' => 'reading_tfng',
            'writer_views'       => 'reading_ynng',
            'headings'           => 'reading_headings',
            'paraphrase'         => 'reading_scanning',
            'scanning_detail'    => 'reading_scanning',
        ],
        'listening' => [
            'self_correction'  => 'listening_self_correction',
            'synonyms'         => 'listening_synonyms',
            'spelling_numbers' => 'listening_prediction',
            'signposting'      => 'listening_signposting',
            'detail'           => 'listening_research_data',
        ],
    ];

    /** A wrong answer in a method lesson shows which method the learner has not absorbed yet. */
    private const LESSON_WEAKNESS = [
        'reading_skimming'          => 'headings',
        'reading_scanning'          => 'scanning_detail',
        'reading_tfng'              => 'false_vs_not_given',
        'reading_ynng'              => 'writer_views',
        'reading_headings'          => 'headings',
        'listening_prediction'      => 'spelling_numbers',
        'listening_self_correction' => 'self_correction',
        'listening_synonyms'        => 'synonyms',
        'listening_signposting'     => 'signposting',
        'listening_research_data'   => 'detail',
    ];

    private const QUESTION_TYPE_WEAKNESS = [
        'tfng'     => 'false_vs_not_given',
        'matching' => 'headings',
        'mcq'      => 'paraphrase',
        'short'    => 'scanning_detail',
    ];

    /** Errors logged before weaknesses existed are filed by their broad category. */
    private const CATEGORY_FALLBACK = [
        'grammar'            => 'other_grammar',
        'vocabulary'         => 'word_choice',
        'collocation'        => 'collocation',
        'low_value_sentence' => 'low_value',
        'reading_logic'      => 'paraphrase',
        'listening_trap'     => 'detail',
    ];

    public static function tagsFor(string $skill): array
    {
        return match ($skill) {
            'writing', 'speaking' => self::LANGUAGE,
            'reading'             => self::READING,
            'listening'           => self::LISTENING,
            default               => [],
        };
    }

    public static function label(string $skill, string $tag): string
    {
        return self::tagsFor($skill)[$tag] ?? 'Other';
    }

    public static function resolve(string $skill, string $category, ?string $tag): string
    {
        $tags = self::tagsFor($skill);
        if ($tag !== null && isset($tags[$tag])) return $tag;

        $fallback = self::CATEGORY_FALLBACK[$category] ?? null;
        return isset($tags[$fallback]) ? $fallback : (array_key_first($tags) ?? 'other_grammar');
    }

    public static function fromQuiz(string $lessonSlug, ?string $questionType): ?string
    {
        return self::LESSON_WEAKNESS[$lessonSlug] ?? self::QUESTION_TYPE_WEAKNESS[$questionType] ?? null;
    }

    public static function fixLessonSlug(string $skill, string $tag): ?string
    {
        return self::FIX_LESSONS[$skill][$tag] ?? null;
    }
}
