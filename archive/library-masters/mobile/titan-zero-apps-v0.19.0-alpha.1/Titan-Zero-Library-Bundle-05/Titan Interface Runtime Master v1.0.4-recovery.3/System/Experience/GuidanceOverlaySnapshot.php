<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Experience;

final readonly class GuidanceOverlaySnapshot implements \JsonSerializable
{
    /** @param list<array<string,mixed>> $steps */
    public function __construct(public string $productSurface, public array $steps, public int $omitted = 0) {}

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return ['product_surface'=>$this->productSurface,'steps'=>$this->steps,'omitted'=>$this->omitted,'presentation_only'=>true,'workflow_authority'=>false];
    }
}
