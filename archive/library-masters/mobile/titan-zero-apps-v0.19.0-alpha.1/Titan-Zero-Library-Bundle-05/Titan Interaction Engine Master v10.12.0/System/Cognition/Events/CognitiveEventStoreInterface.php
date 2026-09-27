<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Cognition\Events;

interface CognitiveEventStoreInterface
{
    public function append(CognitiveEvent $event): void;
    public function find(string $companyId, string $eventId): ?CognitiveEvent;
    /** @return list<CognitiveEvent> */
    public function forCorrelation(string $companyId, string $correlationId): array;
}
