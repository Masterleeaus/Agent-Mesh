<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Cognition\Events;

final class InMemoryCognitiveEventStore implements CognitiveEventStoreInterface
{
    /** @var array<string,CognitiveEvent> */
    private array $events = [];

    public function append(CognitiveEvent $event): void
    {
        $key = $event->companyId . ':' . $event->eventId;
        $this->events[$key] ??= $event;
    }

    public function find(string $companyId, string $eventId): ?CognitiveEvent
    {
        return $this->events[$companyId . ':' . $eventId] ?? null;
    }

    public function forCorrelation(string $companyId, string $correlationId): array
    {
        $events = array_values(array_filter(
            $this->events,
            static fn (CognitiveEvent $event): bool => $event->companyId === $companyId && $event->correlationId === $correlationId,
        ));
        usort($events, static fn (CognitiveEvent $a, CognitiveEvent $b): int => [$a->sequence, $a->occurredAt, $a->eventId] <=> [$b->sequence, $b->occurredAt, $b->eventId]);
        return $events;
    }
}
