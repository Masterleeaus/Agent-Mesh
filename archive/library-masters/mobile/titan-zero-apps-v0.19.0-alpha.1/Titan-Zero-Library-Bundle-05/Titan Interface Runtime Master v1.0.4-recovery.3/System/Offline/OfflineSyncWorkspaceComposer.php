<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Offline;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkTrayAggregatorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Offline\OfflineSyncWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkItemReference;

final readonly class OfflineSyncWorkspaceComposer implements OfflineSyncWorkspaceContract
{
    public function __construct(private GlobalWorkTrayAggregatorContract $trays, private ?ActionRegistryContract $actions = null) {}

    public function compose(InterfaceContext $context, int $limit = 100): OfflineSyncWorkspaceSnapshot
    {
        if ($limit < 1 || $limit > 200) throw new \InvalidArgumentException('Offline/sync workspace limit must be between 1 and 200.');
        $tray = $this->trays->aggregate($context, 'sync', $limit);
        $items=[];$conflicts=[];
        foreach ($tray->items as $source) {
            [$state,$network] = self::states($source->metadata);
            $items[] = new SyncStateItem(
                key:$source->itemKey, sourceAuthority:$source->sourceAuthority, sourceReference:$source->sourceReference,
                label:$source->label, state:$state, networkState:$network, objectRef:$source->objectRef,
                interactionRef:$source->interactionRef, actionRef:$source->actionRef,
                queuedCount:self::boundedInt($source->metadata['queued_count']??0,100000),
                attempts:self::boundedInt($source->metadata['attempts']??0,10000),
                lastSyncAt:self::safeDate($source->metadata['last_sync_at']??null), summary:$source->summary,
            );
            $conflict = $source->metadata['conflict'] ?? null;
            if ($state === 'conflict' && is_array($conflict) && ! array_is_list($conflict)) {
                $summary = trim((string)($conflict['summary'] ?? 'Source reported a synchronization conflict.'));
                $kind = trim((string)($conflict['kind'] ?? 'conflict'));
                $refs = $this->safeActionRefs($context, (array)($conflict['resolution_action_refs']??[]));
                try { $conflicts[] = new SyncConflictItem($source->sourceReference,$kind,$summary,$source->objectRef,$refs); } catch (\Throwable) {}
            }
        }
        return new OfflineSyncWorkspaceSnapshot(self::overall($items), self::network($items), $items, $conflicts, $tray->status);
    }

    /** @param array<string,mixed> $meta @return array{string,string} */
    private static function states(array $meta): array
    {
        $aliases=['local'=>'offline-local','offline_local'=>'offline-local','pending'=>'pending-sync','pending_sync'=>'pending-sync','awaiting_online'=>'awaiting-online'];
        $state=strtolower(str_replace('_','-',(string)($meta['state']??'unknown')));
        $state=$aliases[$state]??$state;
        if (! in_array($state,SyncStateItem::STATES,true)) $state='unknown';
        $network=strtolower((string)($meta['network_state']??'unknown'));
        if (! in_array($network,SyncStateItem::NETWORK,true)) $network='unknown';
        return [$state,$network];
    }

    /** @param list<SyncStateItem> $items */
    private static function overall(array $items): string
    {
        foreach (['conflict','failed','awaiting-online','syncing','pending-sync','offline-local','online','synced'] as $state) {
            foreach ($items as $item) if ($item->state===$state) return $state;
        }
        return 'unknown';
    }

    /** @param list<SyncStateItem> $items */
    private static function network(array $items): string
    {
        foreach (['offline','degraded','online'] as $state) foreach ($items as $item) if ($item->networkState===$state) return $state;
        return 'unknown';
    }

    /** @param array<mixed> $refs @return list<string> */
    private function safeActionRefs(InterfaceContext $context, array $refs): array
    {
        if ($this->actions === null) return [];
        $out=[];
        foreach ($refs as $ref) {
            if (! is_string($ref)) continue;
            $action=$this->actions->get($ref);
            if ($action === null || ! $action->visibleIn($context)) continue;
            $out[$ref]=true;
        }
        return array_keys($out);
    }

    private static function boundedInt(mixed $value,int $max): int { $v=is_numeric($value)?(int)$value:0; return max(0,min($max,$v)); }
    private static function safeDate(mixed $value): ?string { if(!is_string($value)||$value===''||strlen($value)>64)return null; try{new \DateTimeImmutable($value);return $value;}catch(\Throwable){return null;} }
}
