<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\ValueObjects;

use DateTimeImmutable;
use InvalidArgumentException;

final readonly class AssuranceFinding
{
    private const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'];

    /**
     * @param list<EvidenceRef> $evidence
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public string $findingId,
        public int $companyId,
        public string $domain,
        public string $severity,
        public string $title,
        public string $subjectType,
        public string $subjectId,
        public string $status = 'open',
        public array $evidence = [],
        public array $metadata = [],
        public ?string $detectedAt = null,
    ) {
        if ($companyId <= 0) {
            throw new InvalidArgumentException('company_id must be a positive integer.');
        }
        if (!in_array($severity, self::SEVERITIES, true)) {
            throw new InvalidArgumentException('Unsupported finding severity: ' . $severity);
        }
        if (trim($findingId) === '' || trim($domain) === '' || trim($title) === '' || trim($subjectType) === '' || trim($subjectId) === '') {
            throw new InvalidArgumentException('finding_id, domain, title and subject are required.');
        }
        foreach ($evidence as $item) {
            if (!$item instanceof EvidenceRef) {
                throw new InvalidArgumentException('evidence must contain EvidenceRef values.');
            }
            $item->assertCompany($companyId);
        }
    }

    public function detectedAtValue(): string
    {
        return $this->detectedAt ?: (new DateTimeImmutable())->format(DATE_ATOM);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'finding_id' => $this->findingId,
            'company_id' => $this->companyId,
            'domain' => $this->domain,
            'severity' => $this->severity,
            'title' => $this->title,
            'status' => $this->status,
            'subject' => ['type' => $this->subjectType, 'id' => $this->subjectId],
            'detected_at' => $this->detectedAtValue(),
            'evidence' => array_map(static fn (EvidenceRef $ref): array => $ref->toArray(), $this->evidence),
            'metadata' => $this->metadata,
        ];
    }
}
