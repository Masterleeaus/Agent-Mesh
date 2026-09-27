<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\FeedbackEngineInterface;

class FeedbackEngine implements FeedbackEngineInterface
{
    private array $feedback = [];

    public function collect(int $userId, string $type, array $data): void
    {
        $this->feedback[] = ['userId' => $userId, 'type' => $type, 'data' => $data, 'timestamp' => gmdate(DATE_ATOM)];
    }

    public function getFeedback(int $userId, string $type): array
    {
        return array_values(array_filter($this->feedback, static fn(array $item): bool => $item['userId'] === $userId && $item['type'] === $type));
    }

    public function analyze(array $feedback): array
    {
        if ($feedback === []) {
            return ['count' => 0, 'average_rating' => null, 'sentiment' => 'neutral', 'themes' => []];
        }
        $ratings = [];
        $themes = [];
        $positive = $negative = 0;
        foreach ($feedback as $entry) {
            $data = $entry['data'] ?? $entry;
            if (isset($data['rating']) && is_numeric($data['rating'])) {
                $ratings[] = (float) $data['rating'];
            }
            $text = strtolower((string) ($data['comment'] ?? $data['text'] ?? ''));
            foreach (['fast','helpful','easy','good','great'] as $word) { if (str_contains($text, $word)) $positive++; }
            foreach (['slow','hard','bad','error','confusing'] as $word) { if (str_contains($text, $word)) $negative++; }
            foreach (preg_split('/[^a-z0-9]+/', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $token) {
                if (strlen($token) >= 5) $themes[$token] = ($themes[$token] ?? 0) + 1;
            }
        }
        arsort($themes);
        return [
            'count' => count($feedback),
            'average_rating' => $ratings === [] ? null : array_sum($ratings) / count($ratings),
            'sentiment' => $positive === $negative ? 'neutral' : ($positive > $negative ? 'positive' : 'negative'),
            'themes' => array_slice($themes, 0, 10, true),
        ];
    }
}
