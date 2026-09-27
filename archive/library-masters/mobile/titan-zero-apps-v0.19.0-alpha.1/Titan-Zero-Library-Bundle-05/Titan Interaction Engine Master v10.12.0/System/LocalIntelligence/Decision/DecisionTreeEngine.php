<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Decision;

final class DecisionTreeEngine
{
    public function evaluate(array $tree, array $input, float $minimumConfidence = 0.3): array
    {
        $branches = $tree['branches'] ?? $tree['root']['branches'] ?? [];
        $best = null;
        foreach ($branches as $branch) {
            $score = max(0.0, min(1.0, (float) ($branch['base_weight'] ?? 0.5)));
            $evidence = [];
            foreach (($branch['conditions'] ?? []) as $field => $expected) {
                if (array_key_exists($field, $input) && $input[$field] === $expected) {
                    $score = min(1.0, $score + 0.2);
                    $evidence[] = "{$field}=matched";
                } else {
                    $score *= 0.2;
                }
            }
            foreach (($branch['patterns'] ?? []) as $pattern) {
                if ($this->patternMatches((string) $pattern, $input)) {
                    $score = min(1.0, $score + 0.1);
                    $evidence[] = "pattern:{$pattern}";
                }
            }
            foreach (($branch['boosters'] ?? []) as $booster) {
                $condition = $booster['condition'] ?? [];
                if (is_array($condition) && $this->conditionsMatch($condition, $input)) {
                    $score = min(1.0, $score * (float) ($booster['multiplier'] ?? 1.0));
                }
            }
            $candidate = [
                'branch_id' => (string) ($branch['id'] ?? ''),
                'conclusion' => $branch['conclusion']['action'] ?? $branch['conclusion'] ?? null,
                'confidence' => round($score, 4),
                'evidence' => $evidence,
                'question' => $branch['question'] ?? null,
            ];
            if ($best === null || $candidate['confidence'] > $best['confidence']) {
                $best = $candidate;
            }
        }
        if ($best === null || $best['confidence'] < $minimumConfidence) {
            return [
                'branch_id' => null,
                'conclusion' => null,
                'confidence' => $best['confidence'] ?? 0.0,
                'evidence' => $best['evidence'] ?? [],
                'needs_clarification' => true,
            ];
        }
        $best['needs_clarification'] = false;
        return $best;
    }

    private function conditionsMatch(array $conditions, array $input): bool
    {
        foreach ($conditions as $field => $expected) {
            if (($input[$field] ?? null) !== $expected) {
                return false;
            }
        }
        return true;
    }

    private function patternMatches(string $pattern, array $input): bool
    {
        if (array_key_exists($pattern, $input)) {
            return (bool) $input[$pattern];
        }
        $haystack = strtolower(json_encode($input, JSON_UNESCAPED_SLASHES) ?: '');
        return str_contains($haystack, strtolower(str_replace('_', ' ', $pattern)));
    }
}
