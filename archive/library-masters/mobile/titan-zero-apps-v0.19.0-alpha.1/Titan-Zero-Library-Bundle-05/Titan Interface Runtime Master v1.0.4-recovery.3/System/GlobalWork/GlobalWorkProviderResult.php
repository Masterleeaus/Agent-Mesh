<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\GlobalWork;

final readonly class GlobalWorkProviderResult implements \JsonSerializable
{
    /** @param list<GlobalWorkItemReference> $items */
    public function __construct(public array $items, public GlobalWorkProviderHealth $health)
    {
        foreach ($items as $item) {
            if (! $item instanceof GlobalWorkItemReference) throw new \InvalidArgumentException('Global work provider results may contain reference objects only.');
        }
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return ['items'=>array_map(static fn(GlobalWorkItemReference $i):array=>$i->jsonSerialize(),$this->items),'health'=>$this->health->jsonSerialize()];
    }
}
