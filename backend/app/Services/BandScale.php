<?php

namespace App\Services;

class BandScale
{
    // Minimum raw score (out of 40) => band.
    private const LISTENING = [39 => 9, 37 => 8.5, 35 => 8, 32 => 7.5, 30 => 7, 26 => 6.5, 23 => 6, 18 => 5.5, 16 => 5, 13 => 4.5, 10 => 4, 8 => 3.5, 6 => 3, 4 => 2.5];
    private const READING   = [39 => 9, 37 => 8.5, 35 => 8, 33 => 7.5, 30 => 7, 27 => 6.5, 23 => 6, 19 => 5.5, 15 => 5, 13 => 4.5, 10 => 4, 8 => 3.5, 6 => 3, 4 => 2.5];

    public static function fromRaw(string $skill, int $raw): float
    {
        foreach ($skill === 'listening' ? self::LISTENING : self::READING as $min => $band) {
            if ($raw >= $min) return (float) $band;
        }
        return 2.0;
    }

    /** IELTS rounding: .25 rounds up to .5, .75 rounds up to the next whole band. */
    public static function roundHalf(float $value): float
    {
        return floor($value * 2 + 0.5) / 2;
    }
}
