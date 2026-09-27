<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Persona;

final class PersonaSignalAnalyzer
{
    private const POSITIVE = [
        'good', 'great', 'excellent', 'happy', 'pleased', 'appreciate', 'love', 'wonderful',
        'awesome', 'perfect', 'satisfied', 'excited', 'calm', 'helpful', 'thanks', 'thank',
    ];

    private const NEGATIVE = [
        'bad', 'terrible', 'awful', 'unhappy', 'angry', 'frustrated', 'hate', 'poor',
        'disappointed', 'wrong', 'problem', 'issue', 'worried', 'anxious', 'overwhelmed', 'sad',
    ];

    private const FORMAL_MARKERS = [
        'please', 'therefore', 'however', 'regarding', 'appreciate', 'completed', 'professional',
        'documentation', 'summary', 'request', 'require', 'accordingly', 'sincerely',
    ];

    private const INFORMAL_MARKERS = [
        'hey', 'lol', 'gonna', 'wanna', 'yeah', 'nah', 'mate', 'stuff', 'kinda', 'sorta', 'now',
    ];

    /**
     * @return array{sentiment_polarity: float, formality: float, emotional_intensity: float, label: string, evidence: array<string, int|float>}
     */
    public function analyze(string $text): array
    {
        $words = preg_split('/[^\p{L}\p{N}\']+/u', strtolower($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $plainWords = array_map(static fn(string $word): string => trim($word, "'"), $words);
        $positive = count(array_intersect($plainWords, self::POSITIVE));
        $negative = count(array_intersect($plainWords, self::NEGATIVE));
        $sentimentMatches = $positive + $negative;
        $polarity = $sentimentMatches > 0 ? ($positive - $negative) / $sentimentMatches : 0.0;

        preg_match_all('/\b[\p{L}]+\'[\p{L}]+\b/u', strtolower($text), $contractionMatches);
        $contractions = count($contractionMatches[0] ?? []);
        $formalMarkers = count(array_intersect($plainWords, self::FORMAL_MARKERS));
        $informalMarkers = count(array_intersect($plainWords, self::INFORMAL_MARKERS));
        $wordCount = max(1, count($plainWords));
        $sentenceCount = max(1, preg_match_all('/[.!?]+/', $text));
        $averageSentenceLength = $wordCount / $sentenceCount;

        $formality = 0.55;
        $formality += min(0.20, ($formalMarkers / $wordCount) * 5.0);
        $formality += min(0.10, max(0.0, ($averageSentenceLength - 8.0) / 80.0));
        $formality -= min(0.35, ($contractions / $wordCount) * 8.0);
        $formality -= min(0.25, ($informalMarkers / $wordCount) * 6.0);
        $formality = $this->clamp($formality);

        $exclamations = substr_count($text, '!');
        $questions = substr_count($text, '?');
        $intensity = $this->clamp(abs($polarity) * 0.7 + min(0.3, ($exclamations + $questions) * 0.08));

        return [
            'sentiment_polarity' => round($polarity, 4),
            'formality' => round($formality, 4),
            'emotional_intensity' => round($intensity, 4),
            'label' => $this->label($polarity, $formality),
            'evidence' => [
                'positive_matches' => $positive,
                'negative_matches' => $negative,
                'contractions' => $contractions,
                'formal_markers' => $formalMarkers,
                'informal_markers' => $informalMarkers,
                'word_count' => $wordCount,
            ],
        ];
    }

    private function label(float $polarity, float $formality): string
    {
        $mood = match (true) {
            $polarity >= 0.45 => 'positive',
            $polarity >= 0.10 => 'engaged',
            $polarity <= -0.45 => 'frustrated',
            $polarity <= -0.10 => 'concerned',
            default => 'neutral',
        };
        return $mood . ' & ' . ($formality >= 0.62 ? 'formal' : 'casual');
    }

    private function clamp(float $value): float
    {
        return max(0.0, min(1.0, $value));
    }
}
