<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\AbstractionEngineInterface;

class AbstractionEngine implements AbstractionEngineInterface
{
    public function abstract(array $instances): array
    {
        if ($instances === []) {
            return ['common' => [], 'variable' => []];
        }
        $arrays = array_values(array_filter($instances, 'is_array'));
        if ($arrays === []) {
            return ['common' => [], 'variable' => []];
        }
        $keys = array_unique(array_merge(...array_map('array_keys', $arrays)));
        $common = [];
        $variable = [];
        foreach ($keys as $key) {
            $values = array_map(static fn(array $item): mixed => $item[$key] ?? null, $arrays);
            $encoded = array_unique(array_map(static fn($value): string => json_encode($value, JSON_THROW_ON_ERROR), $values));
            if (count($encoded) === 1) {
                $common[$key] = $values[0];
            } else {
                $variable[$key] = array_values(array_unique($values, SORT_REGULAR));
            }
        }
        return ['common' => $common, 'variable' => $variable, 'sample_size' => count($arrays)];
    }

    public function generalize(array $examples): string
    {
        $abstract = $this->abstract($examples);
        if ($abstract['common'] === []) {
            return 'No stable common structure detected';
        }
        return 'Common structure: ' . implode(', ', array_keys($abstract['common']));
    }

    public function classify(string $concept, array $attributes): string
    {
        if (isset($attributes['category'])) {
            return (string) $attributes['category'];
        }
        $tokens = preg_split('/[^a-z0-9]+/i', strtolower($concept), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        return $tokens[0] ?? 'uncategorized';
    }
}
