<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Receipts;

use JsonSerializable;

final readonly class InterfaceReceipt implements JsonSerializable
{
    /** @param array<string, mixed> $metadata */
    public function __construct(
        public string $receiptId,
        public string $status,
        public string $sourceAuthority,
        public ?string $correlationId = null,
        public ?string $causationId = null,
        public ?string $rollbackCapability = null,
        public array $metadata = [],
    ) {
        if ($this->receiptId === '' || $this->status === '' || $this->sourceAuthority === '') {
            throw new \InvalidArgumentException('Receipt id, status and source authority are required.');
        }
    }

    public function isReversible(): bool
    {
        return $this->rollbackCapability !== null && $this->rollbackCapability !== '';
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'receipt_id' => $this->receiptId,
            'status' => $this->status,
            'source_authority' => $this->sourceAuthority,
            'correlation_id' => $this->correlationId,
            'causation_id' => $this->causationId,
            'rollback_capability' => $this->rollbackCapability,
            'reversible' => $this->isReversible(),
            'metadata' => $this->metadata,
        ];
    }
}
