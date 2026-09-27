<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Offline;

final readonly class OfflineSyncWorkspaceSnapshot implements \JsonSerializable
{
    /** @param list<SyncStateItem> $items @param list<SyncConflictItem> $conflicts */
    public function __construct(
        public string $overallState,
        public string $networkState,
        public array $items,
        public array $conflicts,
        public string $sourceTrayStatus,
        public bool $sourceAuthoritative = true,
    ) {
        if (! in_array($overallState, SyncStateItem::STATES, true)) throw new \InvalidArgumentException('Overall sync state is invalid.');
        if (! in_array($networkState, SyncStateItem::NETWORK, true)) throw new \InvalidArgumentException('Overall network state is invalid.');
        foreach ($items as $item) if (! $item instanceof SyncStateItem) throw new \InvalidArgumentException('Invalid sync item.');
        foreach ($conflicts as $conflict) if (! $conflict instanceof SyncConflictItem) throw new \InvalidArgumentException('Invalid conflict item.');
    }

    public function jsonSerialize(): array
    {
        return [
            'overall_state'=>$this->overallState,'network_state'=>$this->networkState,'source_tray_status'=>$this->sourceTrayStatus,
            'source_authoritative'=>$this->sourceAuthoritative,'state_owned_locally'=>false,'conflict_resolution_owned_locally'=>false,
            'items'=>array_map(static fn(SyncStateItem $i):array=>$i->jsonSerialize(),$this->items),
            'conflicts'=>array_map(static fn(SyncConflictItem $c):array=>$c->jsonSerialize(),$this->conflicts),
        ];
    }
}
