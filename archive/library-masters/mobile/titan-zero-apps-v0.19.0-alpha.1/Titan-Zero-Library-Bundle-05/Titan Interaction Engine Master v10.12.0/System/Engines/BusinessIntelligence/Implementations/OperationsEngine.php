<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations;

use App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\OperationsEngineInterface;

/**
 * Real efficiency computed from $data when available, and area-specific
 * suggestions rather than a fixed pair. Fixed during the fix pass:
 * optimize() always returned efficiency=0.8 and suggestImprovements()
 * always returned the same two strings regardless of $area/$data.
 */
class OperationsEngine implements OperationsEngineInterface
{
    public function optimize(string $area, array $data): array
    {
        $completed = $data['completed'] ?? null;
        $total = $data['total'] ?? null;

        $efficiency = (is_numeric($completed) && is_numeric($total) && $total > 0)
            ? round($completed / $total, 2)
            : null;

        return [
            'area' => $area,
            'optimized' => $efficiency !== null,
            'efficiency' => $efficiency,
            'note' => $efficiency === null
                ? 'No completed/total counts provided — cannot compute a real efficiency figure.'
                : null,
        ];
    }

    public function getPerformanceMetrics(): array
    {
        return ['efficiency' => 0.7, 'productivity' => 0.8];
    }

    public function suggestImprovements(string $area): array
    {
        $areaLower = strtolower($area);
        $suggestions = [];

        if (str_contains($areaLower, 'schedul') || str_contains($areaLower, 'dispatch')) {
            $suggestions[] = 'Review job clustering by geography to reduce travel time between jobs.';
        }
        if (str_contains($areaLower, 'invoic') || str_contains($areaLower, 'payment')) {
            $suggestions[] = 'Automate invoice reminders for accounts overdue by more than 14 days.';
        }
        if (str_contains($areaLower, 'staff') || str_contains($areaLower, 'workforce')) {
            $suggestions[] = 'Compare workload distribution across team members for imbalances.';
        }

        if (empty($suggestions)) {
            $suggestions[] = "No specific pattern recognized for '{$area}' — review manually with current metrics.";
        }

        return $suggestions;
    }
}
