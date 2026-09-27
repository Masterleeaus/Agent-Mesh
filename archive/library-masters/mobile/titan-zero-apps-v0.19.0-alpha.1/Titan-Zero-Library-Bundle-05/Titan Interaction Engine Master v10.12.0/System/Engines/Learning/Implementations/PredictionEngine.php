<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\PredictionEngineInterface;

class PredictionEngine implements PredictionEngineInterface
{
    private float $confidence = 0.0;

    public function predict(string $target, array $features): mixed
    {
        if (array_key_exists($target, $features)) {
            $this->confidence = 1.0;
            return $features[$target];
        }
        $history = $features['history'][$target] ?? $features[$target . '_history'] ?? [];
        if (is_array($history) && $history !== []) {
            $numeric = array_values(array_filter($history, 'is_numeric'));
            if (count($numeric) === count($history)) {
                $this->confidence = min(0.95, 0.5 + count($numeric) * 0.05);
                return array_sum($numeric) / count($numeric);
            }
            $counts = array_count_values(array_map(static fn($value): string => json_encode($value, JSON_THROW_ON_ERROR), $history));
            arsort($counts);
            $this->confidence = max($counts) / count($history);
            return json_decode((string) array_key_first($counts), true);
        }
        if (isset($features['default'])) {
            $this->confidence = 0.3;
            return $features['default'];
        }
        $this->confidence = 0.0;
        return null;
    }

    public function batchPredict(array $targets, array $features): array
    {
        $results = [];
        foreach ($targets as $target) {
            $results[(string) $target] = $this->predict((string) $target, $features);
        }
        return $results;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }
}
