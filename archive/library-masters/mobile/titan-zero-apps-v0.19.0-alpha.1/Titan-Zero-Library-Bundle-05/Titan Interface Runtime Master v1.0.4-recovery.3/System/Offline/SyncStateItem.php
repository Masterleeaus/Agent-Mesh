<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Offline;

final readonly class SyncStateItem implements \JsonSerializable
{
    public const STATES = ['online','offline-local','pending-sync','syncing','synced','conflict','failed','awaiting-online','unknown'];
    public const NETWORK = ['online','offline','degraded','unknown'];

    public function __construct(
        public string $key,
        public string $sourceAuthority,
        public string $sourceReference,
        public string $label,
        public string $state,
        public string $networkState,
        public ?string $objectRef,
        public ?string $interactionRef,
        public ?string $actionRef,
        public int $queuedCount = 0,
        public int $attempts = 0,
        public ?string $lastSyncAt = null,
        public ?string $summary = null,
    ) {
        if (! in_array($state, self::STATES, true)) throw new \InvalidArgumentException('Sync state is invalid.');
        if (! in_array($networkState, self::NETWORK, true)) throw new \InvalidArgumentException('Sync network state is invalid.');
        if ($queuedCount < 0 || $queuedCount > 100000 || $attempts < 0 || $attempts > 10000) throw new \InvalidArgumentException('Sync counters are outside presentation bounds.');
    }

    public function jsonSerialize(): array
    {
        return [
            'key'=>$this->key,'source_authority'=>$this->sourceAuthority,'source_reference'=>$this->sourceReference,
            'label'=>$this->label,'state'=>$this->state,'network_state'=>$this->networkState,'object_ref'=>$this->objectRef,
            'interaction_ref'=>$this->interactionRef,'action_ref'=>$this->actionRef,'queued_count'=>$this->queuedCount,
            'attempts'=>$this->attempts,'last_sync_at'=>$this->lastSyncAt,'summary'=>$this->summary,'executable'=>false,
        ];
    }
}
