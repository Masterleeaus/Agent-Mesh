<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\ValueObjects;

use InvalidArgumentException;

final readonly class EvidenceRef
{
    /** @param array<string, mixed> $metadata */
    public function __construct(
        public int $companyId,
        public string $type,
        public string $evidenceId,
        public ?string $hash = null,
        public ?string $uri = null,
        public array $metadata = [],
    ) {
        if ($companyId <= 0) {
            throw new InvalidArgumentException('company_id must be a positive integer.');
        }
        if (trim($type) === '' || trim($evidenceId) === '') {
            throw new InvalidArgumentException('Evidence type and evidence_id are required.');
        }
    }

    public function assertCompany(int $companyId): void
    {
        if ($this->companyId !== $companyId) {
            throw new InvalidArgumentException('Evidence company_id does not match the governing company context.');
        }
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'company_id' => $this->companyId,
            'type' => $this->type,
            'evidence_id' => $this->evidenceId,
            'hash' => $this->hash,
            'uri' => $this->uri,
            'metadata' => $this->metadata,
        ];
    }
}
