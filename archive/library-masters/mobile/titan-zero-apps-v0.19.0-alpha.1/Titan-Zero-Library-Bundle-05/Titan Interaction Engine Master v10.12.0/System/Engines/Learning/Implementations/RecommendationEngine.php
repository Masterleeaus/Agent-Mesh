<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\RecommendationEngineInterface;

class RecommendationEngine implements RecommendationEngineInterface
{
    private array $items = [];
    private array $interactions = [];

    public function recommend(int $userId, array $context): array
    {
        $this->items = $context['items'] ?? $this->items;
        $preferences = array_map('strtolower', array_map('strval', $context['preferences'] ?? []));
        $results = [];
        foreach ($this->items as $id => $item) {
            $itemArray = is_array($item) ? $item : ['name' => (string) $item];
            $text = strtolower(json_encode($itemArray, JSON_UNESCAPED_SLASHES) ?: '');
            $score = (float) ($itemArray['base_score'] ?? 0.5);
            foreach ($preferences as $preference) {
                if ($preference !== '' && str_contains($text, $preference)) {
                    $score += 0.15;
                }
            }
            $score += 0.05 * ($this->interactions[$userId][(string) $id] ?? 0);
            $results[] = ['id' => (string) $id, 'item' => $item, 'score' => round(min(1.0, $score), 4)];
        }
        usort($results, static fn(array $a, array $b): int => $b['score'] <=> $a['score']);
        return array_slice($results, 0, (int) ($context['limit'] ?? 5));
    }

    public function getSimilarItems(string $itemId): array
    {
        if (!isset($this->items[$itemId])) {
            return [];
        }
        $targetTokens = $this->tokens(json_encode($this->items[$itemId], JSON_UNESCAPED_SLASHES) ?: '');
        $results = [];
        foreach ($this->items as $id => $item) {
            if ((string) $id === $itemId) {
                continue;
            }
            $tokens = $this->tokens(json_encode($item, JSON_UNESCAPED_SLASHES) ?: '');
            $union = count(array_unique(array_merge($targetTokens, $tokens)));
            $score = $union > 0 ? count(array_intersect($targetTokens, $tokens)) / $union : 0;
            $results[] = ['id' => (string) $id, 'item' => $item, 'score' => round($score, 4)];
        }
        usort($results, static fn(array $a, array $b): int => $b['score'] <=> $a['score']);
        return $results;
    }

    public function getTrending(): array
    {
        $totals = [];
        foreach ($this->interactions as $userInteractions) {
            foreach ($userInteractions as $id => $count) {
                $totals[$id] = ($totals[$id] ?? 0) + $count;
            }
        }
        arsort($totals);
        return array_map(static fn(string $id, int $count): array => ['id' => $id, 'interactions' => $count], array_keys($totals), array_values($totals));
    }

    private function tokens(string $text): array
    {
        return array_values(array_unique(preg_split('/[^a-z0-9]+/i', strtolower($text), -1, PREG_SPLIT_NO_EMPTY) ?: []));
    }
}
