<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Reasoning;

final class HybridReasoner
{
    private array $rules = [];

    public function addRule(string $name, callable $rule): void
    {
        $this->rules[$name] = $rule;
    }

    public function reason(array $candidates, array $context = []): array
    {
        $evaluated = [];
        foreach ($candidates as $candidate) {
            $base = max(0.0, min(1.0, (float) ($candidate['confidence'] ?? 0.5)));
            $violations = [];
            $support = [];
            foreach ($this->rules as $name => $rule) {
                $verdict = $rule($candidate, $context);
                if ($verdict === false) {
                    $violations[] = $name;
                    $base *= 0.25;
                } elseif (is_numeric($verdict)) {
                    $base *= max(0.0, min(1.5, (float) $verdict));
                    $support[] = $name;
                } elseif ($verdict === true) {
                    $base = min(1.0, $base + 0.05);
                    $support[] = $name;
                }
            }
            $candidate['adjusted_confidence'] = round(min(1.0, $base), 4);
            $candidate['violations'] = $violations;
            $candidate['supporting_rules'] = $support;
            $evaluated[] = $candidate;
        }
        usort($evaluated, static fn(array $a, array $b): int => $b['adjusted_confidence'] <=> $a['adjusted_confidence']);
        $best = $evaluated[0] ?? ['action' => null, 'adjusted_confidence' => 0.0];
        return [
            'action' => $best['action'] ?? null,
            'confidence' => $best['adjusted_confidence'],
            'needs_clarification' => $best['adjusted_confidence'] < 0.65,
            'explanation' => $this->explain($best),
            'alternatives' => array_slice($evaluated, 1, 3),
        ];
    }

    private function explain(array $candidate): string
    {
        if (($candidate['action'] ?? null) === null) {
            return 'No candidate action was available.';
        }
        $parts = ["Selected {$candidate['action']} at confidence {$candidate['adjusted_confidence']}"];
        if (($candidate['supporting_rules'] ?? []) !== []) {
            $parts[] = 'supported by ' . implode(', ', $candidate['supporting_rules']);
        }
        if (($candidate['violations'] ?? []) !== []) {
            $parts[] = 'reduced by ' . implode(', ', $candidate['violations']);
        }
        return implode('; ', $parts) . '.';
    }
}
