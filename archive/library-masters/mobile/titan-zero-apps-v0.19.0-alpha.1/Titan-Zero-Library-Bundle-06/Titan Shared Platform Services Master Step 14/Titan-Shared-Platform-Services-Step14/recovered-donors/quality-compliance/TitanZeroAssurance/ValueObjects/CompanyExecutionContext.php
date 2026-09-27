<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\ValueObjects;

use InvalidArgumentException;
use Modules\TitanZeroAssurance\Support\Identifier;

final readonly class CompanyExecutionContext
{
    /** @param array<string, mixed> $metadata */
    public function __construct(
        public int $companyId,
        public string $actorType,
        public string $actorId,
        public ?string $correlationId = null,
        public ?string $causationId = null,
        public ?string $idempotencyKey = null,
        public array $metadata = [],
    ) {
        if ($companyId <= 0) {
            throw new InvalidArgumentException('company_id must be a positive integer.');
        }
        if (trim($actorType) === '') {
            throw new InvalidArgumentException('actor_type is required.');
        }
        if (trim($actorId) === '') {
            throw new InvalidArgumentException('actor_id is required.');
        }
    }

    public function correlationId(): string
    {
        return $this->correlationId ?: Identifier::uuidV4();
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'company_id' => $this->companyId,
            'actor' => [
                'type' => $this->actorType,
                'id' => $this->actorId,
            ],
            'correlation_id' => $this->correlationId,
            'causation_id' => $this->causationId,
            'idempotency_key' => $this->idempotencyKey,
            'metadata' => $this->metadata,
        ];
    }
}
