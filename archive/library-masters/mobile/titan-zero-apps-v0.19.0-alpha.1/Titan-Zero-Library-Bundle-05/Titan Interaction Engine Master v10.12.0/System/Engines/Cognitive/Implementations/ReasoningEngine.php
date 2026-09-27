<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ReasoningEngineInterface;

class ReasoningEngine implements ReasoningEngineInterface
{
    public function deduce(array $premises): array
    {
        $facts = [];
        $rules = [];
        foreach ($premises as $premise) {
            if (!is_array($premise)) {
                continue;
            }
            if (isset($premise['facts']) && is_array($premise['facts'])) {
                $facts = array_replace($facts, $premise['facts']);
            } elseif (isset($premise['if'], $premise['then'])) {
                $rules[] = $premise;
            } else {
                $facts = array_replace($facts, $premise);
            }
        }
        $derivations = [];
        $changed = true;
        $iterations = 0;
        while ($changed && $iterations++ < 20) {
            $changed = false;
            foreach ($rules as $index => $rule) {
                if ($this->matches((array) $rule['if'], $facts)) {
                    foreach ((array) $rule['then'] as $key => $value) {
                        if (!array_key_exists($key, $facts) || $facts[$key] !== $value) {
                            $facts[$key] = $value;
                            $derivations[] = ['rule' => $index, 'fact' => $key, 'value' => $value];
                            $changed = true;
                        }
                    }
                }
            }
        }
        return ['facts' => $facts, 'derivations' => $derivations, 'confidence' => $rules === [] ? 0.5 : min(1.0, 0.6 + count($derivations) * 0.05)];
    }

    public function induce(array $observations): array
    {
        if ($observations === []) {
            return ['patterns' => [], 'confidence' => 0.0];
        }
        $counts = [];
        foreach ($observations as $observation) {
            foreach ((array) $observation as $key => $value) {
                $encoded = json_encode($value, JSON_THROW_ON_ERROR);
                $counts[$key][$encoded] = ($counts[$key][$encoded] ?? 0) + 1;
            }
        }
        $patterns = [];
        foreach ($counts as $key => $values) {
            arsort($values);
            $encoded = (string) array_key_first($values);
            $frequency = $values[$encoded] / count($observations);
            if ($frequency >= 0.5) {
                $patterns[$key] = ['value' => json_decode($encoded, true), 'frequency' => round($frequency, 4)];
            }
        }
        return ['patterns' => $patterns, 'confidence' => $patterns === [] ? 0.2 : array_sum(array_column($patterns, 'frequency')) / count($patterns)];
    }

    public function abduce(array $observations): array
    {
        $hypotheses = [];
        foreach ($observations as $key => $value) {
            if (is_array($value) && isset($value['possible_causes'])) {
                foreach ((array) $value['possible_causes'] as $cause) {
                    $hypotheses[$cause] = ($hypotheses[$cause] ?? 0) + 1;
                }
            } else {
                $hypotheses["cause_of_{$key}"] = ($hypotheses["cause_of_{$key}"] ?? 0) + 1;
            }
        }
        arsort($hypotheses);
        $total = max(1, array_sum($hypotheses));
        return array_map(static fn(string $name, int $count): array => ['hypothesis' => $name, 'confidence' => round($count / $total, 4)], array_keys($hypotheses), array_values($hypotheses));
    }

    public function decide(array $options): array
    {
        $normalized = [];
        foreach ($options as $index => $option) {
            $option = is_array($option) ? $option : ['value' => $option];
            $score = (float) ($option['score'] ?? $option['confidence'] ?? $option['priority'] ?? 0.5);
            $option['_decision_score'] = $score;
            $option['_original_index'] = $index;
            $normalized[] = $option;
        }
        usort($normalized, static fn(array $a, array $b): int => $b['_decision_score'] <=> $a['_decision_score'] ?: $a['_original_index'] <=> $b['_original_index']);
        $best = $normalized[0] ?? [];
        unset($best['_original_index']);
        return $best;
    }

    private function matches(array $conditions, array $facts): bool
    {
        foreach ($conditions as $key => $expected) {
            if (!array_key_exists($key, $facts) || $facts[$key] !== $expected) {
                return false;
            }
        }
        return true;
    }
}
