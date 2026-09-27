<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Workspace;

use App\Extensions\TitanInterfaceRuntime\System\Objects\ResolvedObjectReference;

final readonly class ObjectWorkspace implements \JsonSerializable
{
    /** @param list<FacetSlot> $facets */
    public function __construct(
        public ResolvedObjectReference $object,
        public string $productSurface,
        public array $facets,
    ) {
    }

    public function jsonSerialize(): array
    {
        return [
            'object' => $this->object->jsonSerialize(),
            'product_surface' => $this->productSurface,
            'facet_loading' => 'lazy',
            'facets' => array_map(static fn (FacetSlot $slot): array => $slot->jsonSerialize(), $this->facets),
        ];
    }
}
