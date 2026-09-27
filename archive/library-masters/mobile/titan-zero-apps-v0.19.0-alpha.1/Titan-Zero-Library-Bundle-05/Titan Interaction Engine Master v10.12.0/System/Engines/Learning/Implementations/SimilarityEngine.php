<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\SimilarityEngineInterface;

class SimilarityEngine implements SimilarityEngineInterface
{
    public function cosineSimilarity(array $a, array $b): float
    {
        $length = max(count($a), count($b));
        $dot = $normA = $normB = 0.0;
        for ($i = 0; $i < $length; $i++) {
            $x = (float) ($a[$i] ?? 0);
            $y = (float) ($b[$i] ?? 0);
            $dot += $x * $y;
            $normA += $x * $x;
            $normB += $y * $y;
        }
        return $normA > 0 && $normB > 0 ? $dot / (sqrt($normA) * sqrt($normB)) : 0.0;
    }

    public function jaccardSimilarity(array $a, array $b): float
    {
        $a = array_values(array_unique($a, SORT_REGULAR));
        $b = array_values(array_unique($b, SORT_REGULAR));
        $intersection = count(array_uintersect($a, $b, static fn($x, $y): int => strcmp(serialize($x), serialize($y))));
        $union = count(array_unique(array_merge(array_map('serialize', $a), array_map('serialize', $b))));
        return $union > 0 ? $intersection / $union : 0.0;
    }

    public function getMostSimilar(string $target, array $candidates): array
    {
        $targetTokens = $this->tokens($target);
        $results = [];
        foreach ($candidates as $key => $candidate) {
            $text = is_array($candidate) ? (string) ($candidate['text'] ?? $candidate['name'] ?? json_encode($candidate)) : (string) $candidate;
            $tokens = $this->tokens($text);
            $score = $this->jaccardSimilarity($targetTokens, $tokens);
            $results[] = ['id' => is_string($key) ? $key : null, 'item' => $candidate, 'score' => round($score, 4)];
        }
        usort($results, static fn(array $a, array $b): int => $b['score'] <=> $a['score']);
        return $results;
    }

    private function tokens(string $text): array
    {
        return array_values(array_unique(preg_split('/[^a-z0-9]+/i', strtolower($text), -1, PREG_SPLIT_NO_EMPTY) ?: []));
    }
}
