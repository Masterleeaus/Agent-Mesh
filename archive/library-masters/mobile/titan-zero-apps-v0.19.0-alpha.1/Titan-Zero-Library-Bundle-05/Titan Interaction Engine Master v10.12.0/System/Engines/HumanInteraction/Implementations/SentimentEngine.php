<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations;

use App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\SentimentEngineInterface;

/**
 * Lexicon-based sentiment scoring — not ML-based, but genuinely derives
 * its output from the input text rather than returning a fixed value.
 * Fixed during the fix pass: the original always returned the identical
 * hardcoded 'positive'/0.8/'neutral' regardless of what was analyzed.
 */
class SentimentEngine implements SentimentEngineInterface
{
    private const POSITIVE_WORDS = [
        'good', 'great', 'excellent', 'happy', 'pleased', 'thanks', 'thank',
        'love', 'wonderful', 'awesome', 'perfect', 'satisfied', 'yes', 'agree',
    ];

    private const NEGATIVE_WORDS = [
        'bad', 'terrible', 'awful', 'unhappy', 'angry', 'frustrated', 'hate',
        'poor', 'disappointed', 'wrong', 'problem', 'issue', 'no', 'never', 'cancel',
    ];

    public function analyze(string $input): array
    {
        [$pos, $neg, $total] = $this->countMatches($input);
        $score = $total > 0 ? ($pos - $neg) / $total : 0.0;
        $score = max(-1.0, min(1.0, $score));

        return [
            'sentiment' => $this->classify($score),
            'score' => round(($score + 1) / 2, 2), // normalize to 0..1
            'positive_matches' => $pos,
            'negative_matches' => $neg,
        ];
    }

    public function getSentimentScore(string $input): float
    {
        [$pos, $neg, $total] = $this->countMatches($input);
        if ($total === 0) {
            return 0.5;
        }
        return round((($pos - $neg) / $total + 1) / 2, 2);
    }

    public function getPolarity(string $input): string
    {
        return $this->analyze($input)['sentiment'];
    }

    private function countMatches(string $input): array
    {
        $words = preg_split('/\W+/', strtolower($input), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $pos = count(array_intersect($words, self::POSITIVE_WORDS));
        $neg = count(array_intersect($words, self::NEGATIVE_WORDS));
        return [$pos, $neg, $pos + $neg];
    }

    private function classify(float $score): string
    {
        return match (true) {
            $score > 0.15 => 'positive',
            $score < -0.15 => 'negative',
            default => 'neutral',
        };
    }
}
