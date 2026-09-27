<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\GlobalWork;

final readonly class GlobalWorkTraySnapshot implements \JsonSerializable
{
    /**
     * @param list<GlobalWorkItemReference> $items
     * @param list<GlobalWorkProviderHealth> $providerHealth
     * @param array<string,int> $omitted
     */
    public function __construct(
        public string $tray,
        public string $status,
        public array $items,
        public array $providerHealth,
        public int $deduplicated = 0,
        public array $omitted = [],
        public bool $truncated = false,
    ) {
        if (! in_array($status, ['ready','empty','degraded'], true)) throw new \InvalidArgumentException('Global work tray status is invalid.');
        foreach ($items as $item) if (! $item instanceof GlobalWorkItemReference) throw new \InvalidArgumentException('Global work tray contains an invalid item.');
        foreach ($providerHealth as $health) if (! $health instanceof GlobalWorkProviderHealth) throw new \InvalidArgumentException('Global work tray contains invalid provider health.');
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'tray'=>$this->tray,'status'=>$this->status,
            'items'=>array_map(static fn(GlobalWorkItemReference $i):array=>$i->jsonSerialize(),$this->items),
            'provider_health'=>array_map(static fn(GlobalWorkProviderHealth $h):array=>$h->jsonSerialize(),$this->providerHealth),
            'deduplicated'=>$this->deduplicated,'omitted'=>$this->omitted,'truncated'=>$this->truncated,
            'item_count'=>count($this->items),
        ];
    }
}
