<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Navigation;

final readonly class NavigationProjection implements \JsonSerializable
{
    /** @param list<array<string,mixed>> $items */
    public function __construct(
        public string $productSurface,
        public ?string $activeDomain,
        public string $activeIntent,
        public array $items,
    ) {
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'product_surface' => $this->productSurface,
            'active_domain' => $this->activeDomain,
            'active_intent' => $this->activeIntent,
            'items' => $this->items,
        ];
    }
}
