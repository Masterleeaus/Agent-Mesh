<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\ValueObjects;

use InvalidArgumentException;
use Modules\TitanZeroAssurance\Support\Identifier;

final readonly class WorkItemRequest
{
    private const RISKS = ['low', 'medium', 'high', 'critical'];

    /**
     * @param list<string> $requiredCapabilities
     * @param array<string, mixed> $payload
     */
    public function __construct(
        public string $requestId,
        public int $companyId,
        public string $workType,
        public string $action,
        public string $risk,
        public array $requiredCapabilities = [],
        public array $payload = [],
        public ?string $sourceFindingId = null,
        public ?string $correlationId = null,
        public ?string $idempotencyKey = null,
    ) {
        if ($companyId <= 0) {
            throw new InvalidArgumentException('company_id must be a positive integer.');
        }
        if (!in_array($risk, self::RISKS, true)) {
            throw new InvalidArgumentException('Unsupported work risk: ' . $risk);
        }
        if (trim($requestId) === '' || trim($workType) === '' || trim($action) === '') {
            throw new InvalidArgumentException('request_id, work_type and action are required.');
        }
    }

    /** @param list<string> $requiredCapabilities */
    public static function fromFinding(
        AssuranceFinding $finding,
        string $workType,
        string $action,
        string $risk,
        array $requiredCapabilities = [],
        array $payload = [],
        ?string $correlationId = null,
        ?string $idempotencyKey = null,
    ): self {
        return new self(
            requestId: Identifier::uuidV4(),
            companyId: $finding->companyId,
            workType: $workType,
            action: $action,
            risk: $risk,
            requiredCapabilities: $requiredCapabilities,
            payload: $payload,
            sourceFindingId: $finding->findingId,
            correlationId: $correlationId,
            idempotencyKey: $idempotencyKey,
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'request_id' => $this->requestId,
            'company_id' => $this->companyId,
            'work_type' => $this->workType,
            'action' => $this->action,
            'risk' => $this->risk,
            'required_capabilities' => $this->requiredCapabilities,
            'payload' => $this->payload,
            'source_finding_id' => $this->sourceFindingId,
            'correlation_id' => $this->correlationId,
            'idempotency_key' => $this->idempotencyKey,
        ];
    }
}
