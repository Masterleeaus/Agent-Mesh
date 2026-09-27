<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Offline;

final class DeviceQueueEnvelopeFactory
{
    public function __construct(private GoOfflineReplayPolicy $policy) {}

    public function make(GoOfflineOperation $operation): array
    {
        $this->policy->validate($operation);

        return $operation->toArray() + [
            'queue_policy' => 'device_local_durable',
            'replay_authority' => 'provider_capability_gateway',
            'idempotency_required' => true,
            'conflict_policy' => 'provider_authoritative_entity_version',
        ];
    }
}
