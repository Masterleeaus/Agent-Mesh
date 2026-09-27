<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\InferenceEngineInterface;

class InferenceEngine implements InferenceEngineInterface
{
    public function infer(string $target, array $context): mixed
    {
        if (array_key_exists($target, $context)) {
            return $context[$target];
        }
        $value = $context;
        foreach (explode('.', $target) as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $context['defaults'][$target] ?? null;
            }
            $value = $value[$segment];
        }
        return $value;
    }

    public function predict(string $target, array $context): mixed
    {
        $history = $context['history'][$target] ?? $context[$target . '_history'] ?? [];
        if (!is_array($history) || $history === []) {
            return $this->infer($target, $context);
        }
        $numeric = array_values(array_filter($history, 'is_numeric'));
        if (count($numeric) === count($history)) {
            $weights = range(1, count($numeric));
            $weighted = 0.0;
            foreach ($numeric as $i => $value) {
                $weighted += (float) $value * $weights[$i];
            }
            return $weighted / array_sum($weights);
        }
        $counts = array_count_values(array_map(static fn($v): string => json_encode($v, JSON_THROW_ON_ERROR), $history));
        arsort($counts);
        return json_decode((string) array_key_first($counts), true);
    }

    public function estimate(string $target, array $context): float
    {
        $value = $this->predict($target, $context);
        return is_numeric($value) ? (float) $value : 0.0;
    }
}
