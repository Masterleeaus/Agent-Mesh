<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\MemoryConsolidationEngineInterface;

class MemoryConsolidationEngine implements MemoryConsolidationEngineInterface
{
    private array $pending = [];
    private array $consolidated = [];

    public function consolidate(array $events): void
    {
        $summary = $this->summarize($events);
        $summary['consolidated_at'] = gmdate(DATE_ATOM);
        $this->consolidated[] = $summary;
        $this->pending = [];
    }

    public function summarize(array $events): array
    {
        $types = [];
        $important = [];
        foreach ($events as $event) {
            $event = (array) $event;
            $type = (string) ($event['type'] ?? $event['event_type'] ?? 'unknown');
            $types[$type] = ($types[$type] ?? 0) + 1;
            if (($event['importance'] ?? 0) >= 0.7 || ($event['pinned'] ?? false)) {
                $important[] = $event;
            }
        }
        arsort($types);
        return [
            'event_count' => count($events),
            'types' => $types,
            'important_events' => $important,
            'first_at' => $events[0]['timestamp'] ?? null,
            'last_at' => $events[array_key_last($events)]['timestamp'] ?? null,
        ];
    }

    public function prioritizeForConsolidation(): array
    {
        usort($this->pending, static fn(array $a, array $b): int => ($b['importance'] ?? 0) <=> ($a['importance'] ?? 0));
        return $this->pending;
    }

    public function queue(array $event): void
    {
        $this->pending[] = $event;
    }
}
