<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\PatternRecognitionEngineInterface;

class PatternRecognitionEngine implements PatternRecognitionEngineInterface
{
    public function findPatterns(array $data): array
    {
        $frequency = [];
        foreach ($data as $item) {
            $encoded = json_encode($item, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
            $frequency[$encoded] = ($frequency[$encoded] ?? 0) + 1;
        }
        arsort($frequency);
        $total = max(1, count($data));
        return array_map(static fn(string $encoded, int $count): array => [
            'pattern' => json_decode($encoded, true),
            'count' => $count,
            'frequency' => round($count / $total, 4),
        ], array_keys($frequency), array_values($frequency));
    }

    public function classify(array $features): string
    {
        if (isset($features['label'])) {
            return (string) $features['label'];
        }
        if (isset($features['scores']) && is_array($features['scores']) && $features['scores'] !== []) {
            arsort($features['scores']);
            return (string) array_key_first($features['scores']);
        }
        if (isset($features['type'])) {
            return (string) $features['type'];
        }
        return 'unclassified';
    }

    public function cluster(array $items): array
    {
        $clusters = [];
        foreach ($items as $item) {
            $itemArray = is_array($item) ? $item : ['value' => $item];
            $cluster = (string) ($itemArray['category'] ?? $itemArray['type'] ?? $this->classify($itemArray));
            $clusters[$cluster][] = $item;
        }
        return $clusters;
    }
}
