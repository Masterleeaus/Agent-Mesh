<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use DateTimeImmutable;

final readonly class SpatialDecisionReceipt
{
    public function __construct(
        public string $receiptId,
        public string $traceId,
        public string $correlationId,
        public ?string $causationId,
        public string $companyId,
        public string $capabilityId,
        public string $status,
        public array $reasonCodes = [],
        public array $evidenceReferences = [],
        public ?string $riskReference = null,
        public ?string $assuranceReference = null,
        public ?string $autonomyReference = null,
        public ?string $commandReceiptReference = null,
        public ?string $rewindReference = null,
        public ?string $rationaleSummary = null,
        public DateTimeImmutable $createdAt = new DateTimeImmutable(),
    ) {}

    public function toArray(): array
    {
        return [
            'receipt_id' => $this->receiptId,
            'trace_id' => $this->traceId,
            'correlation_id' => $this->correlationId,
            'causation_id' => $this->causationId,
            'company_id' => $this->companyId,
            'capability_id' => $this->capabilityId,
            'status' => $this->status,
            'reason_codes' => $this->reasonCodes,
            'evidence_references' => $this->evidenceReferences,
            'risk_reference' => $this->riskReference,
            'assurance_reference' => $this->assuranceReference,
            'autonomy_reference' => $this->autonomyReference,
            'command_receipt_reference' => $this->commandReceiptReference,
            'rewind_reference' => $this->rewindReference,
            'rationale_summary' => $this->rationaleSummary,
            'created_at' => $this->createdAt->format(DATE_ATOM),
        ];
    }
}
