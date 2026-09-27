<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\GeneralizationEngineInterface;

class GeneralizationEngine implements GeneralizationEngineInterface
{
    public function generalize(array $examples): array
    {
        $examples = array_values(array_filter($examples, 'is_array'));
        if ($examples === []) {
            return ['rules' => [], 'sample_size' => 0];
        }
        $keys = array_unique(array_merge(...array_map('array_keys', $examples)));
        $rules = [];
        foreach ($keys as $key) {
            $values = array_map(static fn(array $example): mixed => $example[$key] ?? null, $examples);
            $unique = array_values(array_unique($values, SORT_REGULAR));
            if (count($unique) === 1) {
                $rules[$key] = ['operator' => 'equals', 'value' => $unique[0]];
                continue;
            }
            $numeric = array_values(array_filter($values, 'is_numeric'));
            if (count($numeric) === count($values)) {
                $rules[$key] = ['operator' => 'between', 'min' => min($numeric), 'max' => max($numeric)];
            } else {
                $rules[$key] = ['operator' => 'in', 'values' => $unique];
            }
        }
        return ['rules' => $rules, 'sample_size' => count($examples)];
    }

    public function applyGeneralization(array $general, array $newInstance): array
    {
        $matches = [];
        foreach (($general['rules'] ?? $general) as $field => $rule) {
            $value = $newInstance[$field] ?? null;
            $matches[$field] = match ($rule['operator'] ?? null) {
                'equals' => $value === ($rule['value'] ?? null),
                'between' => is_numeric($value) && $value >= ($rule['min'] ?? -INF) && $value <= ($rule['max'] ?? INF),
                'in' => in_array($value, $rule['values'] ?? [], true),
                default => false,
            };
        }
        return ['matches' => $matches, 'accepted' => !in_array(false, $matches, true), 'instance' => $newInstance];
    }

    public function validateGeneralization(array $general, array $testSet): float
    {
        if ($testSet === []) {
            return 0.0;
        }
        $accepted = 0;
        foreach ($testSet as $instance) {
            if ($this->applyGeneralization($general, (array) $instance)['accepted']) {
                $accepted++;
            }
        }
        return $accepted / count($testSet);
    }
}
