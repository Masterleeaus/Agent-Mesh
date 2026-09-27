<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ExplainabilityEngineInterface;

/**
 * Builds explanation text/reasons from the actual $decision and $context
 * given, rather than a fixed revenue-themed sentence and canned reason
 * pair for every decision. Fixed during the fix pass: explain() always
 * mentioned "increasing revenue" regardless of the real decision, and
 * getReasons()/visualize() always returned the same two entries.
 */
class ExplainabilityEngine implements ExplainabilityEngineInterface
{
    public function explain(string $decision, array $context): string
    {
        $reasons = $this->getReasons($decision);
        if (empty($context) && empty($reasons)) {
            return "Decided to {$decision}, but no supporting context or reasons were recorded.";
        }

        $reasonText = !empty($reasons) ? implode('; ', $reasons) : 'no specific reasons were recorded';
        $contextText = !empty($context)
            ? ' Relevant context: ' . implode(', ', array_map(
                fn ($k, $v) => "{$k}=" . (is_scalar($v) ? $v : json_encode($v)),
                array_keys($context),
                $context
            )) . '.'
            : '';

        return "Decided to {$decision} because: {$reasonText}.{$contextText}";
    }

    public function getReasons(string $decision): array
    {
        // Without a decision log/audit trail wired into this interface,
        // an honest implementation can only derive reasons from the
        // decision string itself (its stated action) rather than fabricate
        // business justifications like "cost-effective" for every case.
        $words = preg_split('/[_\s]+/', $decision, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (empty($words)) {
            return [];
        }
        return ['stated_action' => implode(' ', $words)];
    }

    public function visualize(string $decision): array
    {
        $reasons = $this->getReasons($decision);
        return [
            'decision' => $decision,
            'reason_count' => count($reasons),
            'summary' => !empty($reasons)
                ? 'Based on: ' . implode(', ', array_values($reasons))
                : 'No reasons available to visualize.',
        ];
    }
}
