<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;

final class InMemoryActionRegistry implements ActionRegistryContract
{
    private ActionRegistrySnapshot $current;

    public function __construct(private readonly ObjectRegistryContract $objects)
    {
        $this->current = new ActionRegistrySnapshot();
    }

    public function rebuild(array $contributions): ActionRegistrySnapshot
    {
        ksort($contributions, SORT_STRING);
        $candidates=[]; $byContributor=[]; $rejected=[];
        foreach ($contributions as $extensionKey=>$contribution) {
            try {
                $descriptor=$this->unwrapDescriptor($contribution);
                $items=$descriptor['actions'] ?? null;
                if (! is_array($items) || ! array_is_list($items)) throw new \InvalidArgumentException('actions must be a list.');
                $contractVersion=(string)($descriptor['schema_version'] ?? '1.0');
                $built=[];
                foreach ($items as $item) {
                    if (! is_array($item) || array_is_list($item)) throw new \InvalidArgumentException('action entries must be objects.');
                    $built[]=ActionDescriptor::fromArray((string)$extensionKey,$item,$contractVersion);
                }
                foreach ($built as $action) { $candidates[$action->key][]=$action; $byContributor[(string)$extensionKey][]=$action->key; }
            } catch (\Throwable $e) { $rejected[(string)$extensionKey][]=$e->getMessage(); }
        }

        $collisions=[]; $active=[];
        foreach ($candidates as $key=>$owners) {
            if (count($owners)!==1) {
                $ownerKeys=array_map(static fn(ActionDescriptor $a):string=>$a->extensionKey,$owners); sort($ownerKeys,SORT_STRING);
                $collisions[$key]=array_values(array_unique($ownerKeys)); continue;
            }
            $active[$key]=$owners[0];
        }

        $knownObjects=$this->objects->all(); $rejectOwners=[];
        foreach ($active as $action) foreach ($action->appliesTo as $objectKey) {
            if (! isset($knownObjects[$objectKey])) $rejectOwners[$action->extensionKey][]="action '{$action->key}' applies_to unknown or unavailable object '{$objectKey}'";
        }
        foreach ($rejectOwners as $extensionKey=>$messages) {
            foreach (array_unique($messages) as $message) $rejected[$extensionKey][]=$message;
            foreach ($byContributor[$extensionKey] ?? [] as $key) unset($active[$key]);
        }

        $byObject=[];
        foreach ($active as $action) foreach ($action->appliesTo as $objectKey) $byObject[$objectKey][]=$action->key;
        foreach ($byObject as &$keys) { sort($keys,SORT_STRING); $keys=array_values(array_unique($keys)); } unset($keys);
        ksort($active,SORT_STRING); ksort($byObject,SORT_STRING); ksort($collisions,SORT_STRING);
        foreach ($rejected as &$messages) $messages=array_values(array_unique($messages)); unset($messages); ksort($rejected,SORT_STRING);
        return $this->current=new ActionRegistrySnapshot($active,$byObject,$collisions,$rejected);
    }

    public function snapshot(): ActionRegistrySnapshot { return $this->current; }
    public function all(): array { return $this->current->actions; }
    public function get(string $actionKey): ?ActionDescriptor { return $this->current->actions[$actionKey] ?? null; }

    public function forObject(string $objectKey, InterfaceContext $context): array
    {
        if ($this->objects->get($objectKey)===null) return [];
        $out=[];
        foreach ($this->current->byObject[$objectKey] ?? [] as $key) {
            $action=$this->current->actions[$key] ?? null;
            if ($action!==null && $action->visibleIn($context)) $out[$key]=$action;
        }
        return $out;
    }

    /** @param array<string,mixed> $contribution @return array<string,mixed> */
    private function unwrapDescriptor(array $contribution): array
    {
        $descriptor=$contribution['descriptor'] ?? $contribution;
        if (! is_array($descriptor) || array_is_list($descriptor)) throw new \InvalidArgumentException('contribution descriptor must be an object.');
        return $descriptor;
    }
}
