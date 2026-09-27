<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Events;

use DateTimeImmutable;

abstract readonly class MapsDomainEvent
{
    public function __construct(
        public string $companyId,
        public ?string $userId = null,
        public ?string $agentId = null,
        public ?string $conversationId = null,
        public ?string $correlationId = null,
        public ?string $causationId = null,
        public array $payload = [],
        public DateTimeImmutable $occurredAt = new DateTimeImmutable(),
    ) {}

    abstract public static function eventName(): string;

    public function toArray(): array
    {
        return [
            'type' => static::eventName(),
            'company_id' => $this->companyId,
            'company_id' => $this->companyId,
            'user_id' => $this->userId,
            'agent_id' => $this->agentId,
            'conversation_id' => $this->conversationId,
            'trace_id' => $this->correlationId,
            'correlation_id' => $this->correlationId,
            'causation_id' => $this->causationId,
            'payload' => $this->payload,
            'occurred_at' => $this->occurredAt->format(DATE_ATOM),
        ];
    }
}
