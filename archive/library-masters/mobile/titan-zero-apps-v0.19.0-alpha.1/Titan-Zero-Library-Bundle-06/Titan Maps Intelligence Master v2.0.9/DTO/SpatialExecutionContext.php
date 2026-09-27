<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use DateTimeImmutable;

final readonly class SpatialExecutionContext
{
    public function __construct(
        public string $traceId,
        public string $correlationId,
        public ?string $causationId,
        public string $companyId,
        public ?string $userId,
        public ?string $agentId,
        public ?string $conversationId,
        public string $capabilityId,
        public string $origin = 'human',
        public DateTimeImmutable $createdAt = new DateTimeImmutable(),
    ) {}

    public function toArray(): array
    {
        return [
            'trace_id' => $this->traceId,
            'correlation_id' => $this->correlationId,
            'causation_id' => $this->causationId,
            'company_id' => $this->companyId,
            'user_id' => $this->userId,
            'agent_id' => $this->agentId,
            'conversation_id' => $this->conversationId,
            'capability_id' => $this->capabilityId,
            'origin' => $this->origin,
            'created_at' => $this->createdAt->format(DATE_ATOM),
        ];
    }
}
