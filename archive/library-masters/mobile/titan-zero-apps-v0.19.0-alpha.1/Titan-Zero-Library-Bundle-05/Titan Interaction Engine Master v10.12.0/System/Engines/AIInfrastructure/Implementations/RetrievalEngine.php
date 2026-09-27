<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations;

use App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\RetrievalEngineInterface;

class RetrievalEngine implements RetrievalEngineInterface
{
    private array $lastSource = [];

    public function retrieve(string $query, array $source): array
    {
        $this->lastSource = $source;
        $queryTokens = $this->tokens($query);
        $results = [];
        foreach ($source as $key => $item) {
            $text = is_array($item) ? (string) ($item['text'] ?? $item['content'] ?? json_encode($item)) : (string) $item;
            $tokens = $this->tokens($text);
            $union = count(array_unique(array_merge($queryTokens, $tokens)));
            $score = $union === 0 ? 0.0 : count(array_intersect($queryTokens, $tokens)) / $union;
            $results[] = ['id' => is_string($key) ? $key : ($item['id'] ?? $key), 'item' => $item, 'score' => round($score, 4)];
        }
        return $this->reRank($results);
    }

    public function reRank(array $results): array
    {
        usort($results, static fn(array $a, array $b): int => ($b['score'] ?? 0) <=> ($a['score'] ?? 0));
        return $results;
    }

    public function getTopK(string $query, int $k): array
    {
        return array_slice($this->retrieve($query, $this->lastSource), 0, max(0, $k));
    }

    private function tokens(string $text): array
    {
        return array_values(array_unique(preg_split('/[^a-z0-9]+/i', strtolower($text), -1, PREG_SPLIT_NO_EMPTY) ?: []));
    }
}
