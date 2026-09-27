<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Persona;

/** Lightweight RAKE-inspired phrase extraction without NLTK or network assets. */
final class KeywordTriggerExtractor
{
    /** @var array<string, true> */
    private array $stopwords;

    public function __construct()
    {
        $words = [
            'a','an','and','are','as','at','be','been','but','by','can','did','do','does','for','from','had','has','have',
            'he','her','hers','him','his','i','if','in','into','is','it','its','me','my','of','on','or','our','she','so',
            'that','the','their','them','there','they','this','to','was','we','were','what','when','where','which','who',
            'will','with','would','you','your','now','just','very','really','please',
        ];
        $this->stopwords = array_fill_keys($words, true);
    }

    /** @return list<string> */
    public function extract(string $text, int $limit = 3): array
    {
        $tokens = preg_split('/([^\p{L}\p{N}\']+|\b(?:' . implode('|', array_keys($this->stopwords)) . ')\b)/iu', strtolower($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $phrases = [];
        foreach ($tokens as $token) {
            $phrase = trim(preg_replace('/\s+/u', ' ', $token) ?? '');
            if ($phrase === '' || strlen($phrase) < 3 || isset($this->stopwords[$phrase])) {
                continue;
            }
            $words = preg_split('/\s+/u', $phrase, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            if (count($words) > 5) {
                $words = array_slice($words, 0, 5);
                $phrase = implode(' ', $words);
            }
            $phrases[$phrase] = ($phrases[$phrase] ?? 0.0) + count($words) + (strlen($phrase) / 100.0);
        }
        arsort($phrases);
        return array_slice(array_keys($phrases), 0, max(0, $limit));
    }
}
