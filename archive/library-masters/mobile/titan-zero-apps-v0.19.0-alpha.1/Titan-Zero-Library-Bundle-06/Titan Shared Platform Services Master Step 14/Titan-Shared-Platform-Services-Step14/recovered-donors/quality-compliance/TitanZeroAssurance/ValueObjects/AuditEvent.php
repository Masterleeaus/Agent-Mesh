<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\ValueObjects;

use DateTimeImmutable;
use InvalidArgumentException;
use Modules\TitanZeroAssurance\Support\Identifier;

final readonly class AuditEvent
{
    /**
     * @param list<EvidenceRef> $evidence
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public string $eventId,
        public int $companyId,
        public string $action,
        public string $outcome,
        public string $subjectType,
        public string $subjectId,
        public string $actorType,
        public string $actorId,
        public string $correlationId,
        public ?string $causationId,
        public ?string $idempotencyKey,
        public string $occurredAt,
        public array $evidence = [],
        public array $metadata = [],
    ) {
        if ($companyId <= 0) {
            throw new InvalidArgumentException('company_id must be a positive integer.');
        }
        foreach ($evidence as $item) {
            if (!$item instanceof EvidenceRef) {
                throw new InvalidArgumentException('evidence must contain EvidenceRef values.');
            }
            $item->assertCompany($companyId);
        }
    }

    /**
     * @param list<EvidenceRef> $evidence
     * @param array<string, mixed> $metadata
     */
    public static function fromContext(
        CompanyExecutionContext $context,
        string $action,
        string $outcome,
        string $subjectType,
        string $subjectId,
        array $evidence = [],
        array $metadata = [],
    ): self {
        return new self(
            eventId: Identifier::uuidV4(),
            companyId: $context->companyId,
            action: $action,
            outcome: $outcome,
            subjectType: $subjectType,
            subjectId: $subjectId,
            actorType: $context->actorType,
            actorId: $context->actorId,
            correlationId: $context->correlationId ?: Identifier::uuidV4(),
            causationId: $context->causationId,
            idempotencyKey: $context->idempotencyKey,
            occurredAt: (new DateTimeImmutable())->format(DATE_ATOM),
            evidence: $evidence,
            metadata: $metadata,
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'event_id' => $this->eventId,
            'company_id' => $this->companyId,
            'action' => $this->action,
            'outcome' => $this->outcome,
            'subject' => ['type' => $this->subjectType, 'id' => $this->subjectId],
            'actor' => ['type' => $this->actorType, 'id' => $this->actorId],
            'correlation_id' => $this->correlationId,
            'causation_id' => $this->causationId,
            'idempotency_key' => $this->idempotencyKey,
            'occurred_at' => $this->occurredAt,
            'evidence' => array_map(static fn (EvidenceRef $ref): array => $ref->toArray(), $this->evidence),
            'metadata' => $this->metadata,
        ];
    }
}
