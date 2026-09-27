<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Offline;

final class GoOfflineBatchEnvelopeFactory
{
    public function __construct(private GoOfflineReplayPolicy $policy) {}

    /** @param list<GoOfflineOperation> $operations @return array<string,mixed> */
    public function make(array $operations): array
    {
        $scope = $this->policy->validateBatch($operations);

        return [
            'schema' => 'titan.apps.go.offline-batch.v1',
            'surface' => 'go',
            'company_id' => $scope['company_id'],
            'actor_id' => $scope['actor_id'],
            'device_id' => $scope['device_id'],
            'idempotency' => 'operation_id',
            'replay_authority' => 'provider_capability_gateway',
            'conflict_policy' => 'provider_authoritative_entity_version',
            'operations' => array_map(static fn (GoOfflineOperation $operation): array => $operation->toArray(), $operations),
        ];
    }
}
