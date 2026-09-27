<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Offline;

final readonly class GoOfflineOperation
{
    public function __construct(
        public string $companyId,
        public string $actorId,
        public string $deviceId,
        public string $capability,
        public string $operationId,
        public string $occurredAt,
        public array $payload,
        public ?int $baseVersion = null,
        public ?string $entityType = null,
        public ?string $entityPublicId = null,
        public array $auditContext = []
    ) {
        foreach (['companyId','actorId','deviceId','capability','operationId','occurredAt'] as $field) {
            if (trim((string) $this->$field) === '') {
                throw new \InvalidArgumentException("Go offline operation requires {$field}.");
            }
        }
    }

    public function toArray(): array
    {
        return [
            'schema' => 'titan.apps.go.offline-operation.v1',
            'surface' => 'go',
            'company_id' => $this->companyId,
            'actor_id' => $this->actorId,
            'device_id' => $this->deviceId,
            // Titan Field names this replay field "operation". capability is retained
            // for governed intent/audit correlation without changing provider authority.
            'operation' => $this->capability,
            'capability' => $this->capability,
            'operation_id' => $this->operationId,
            'occurred_at' => $this->occurredAt,
            'entity_type' => $this->entityType,
            'entity_public_id' => $this->entityPublicId,
            'base_entity_version' => $this->baseVersion,
            'payload' => $this->payload,
            'audit_context' => $this->auditContext,
        ];
    }
}
