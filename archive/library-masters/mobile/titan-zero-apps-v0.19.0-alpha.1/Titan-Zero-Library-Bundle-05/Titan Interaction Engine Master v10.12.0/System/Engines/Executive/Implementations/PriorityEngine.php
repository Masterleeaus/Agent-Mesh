<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\PriorityEngineInterface;
class PriorityEngine implements PriorityEngineInterface
{
    private array $overrides = [];

    public function rank(array $items, array $context = []): array
    {
        foreach ($items as &$item) {
            $score = 0;
            if (isset($item['urgency'])) {
                $score += $item['urgency'] * 10;
            }
            if (isset($item['impact'])) {
                $score += $item['impact'] * 5;
            }
            if (isset($context['user_role']) && $context['user_role'] === 'manager') {
                $score += 20;
            }
            $key = (string) ($item['id'] ?? $item['name'] ?? '');
            $score += $this->overrides[$key] ?? 0;
            $item['priority_score'] = $score;
        }
        unset($item);
        usort($items, fn($a, $b) => ($b['priority_score'] ?? 0) <=> ($a['priority_score'] ?? 0));
        return $items;
    }

    public function getHighestPriority(array $items, array $context = []): ?array
    {
        $ranked = $this->rank($items, $context);
        return $ranked[0] ?? null;
    }

    public function setPriority(string $item, int $priority): void
    {
        $this->overrides[$item] = $priority;
    }
}
