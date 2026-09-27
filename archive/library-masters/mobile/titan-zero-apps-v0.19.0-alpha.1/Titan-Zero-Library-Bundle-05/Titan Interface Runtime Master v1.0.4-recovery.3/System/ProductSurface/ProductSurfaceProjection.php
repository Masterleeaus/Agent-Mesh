<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\ProductSurface;

final readonly class ProductSurfaceProjection implements \JsonSerializable
{
    /**
     * @param list<string> $domains
     * @param list<string> $objects
     * @param array<string,list<string>> $views
     * @param array<string,list<string>> $facets
     * @param array<string,array{primary:list<string>,secondary:list<string>}> $actions
     */
    public function __construct(
        public ProductSurfaceProfile $profile,
        public array $domains,
        public array $objects,
        public array $views,
        public array $facets,
        public array $actions,
    ) {}

    public function jsonSerialize(): array
    {
        return [
            'profile'=>$this->profile->jsonSerialize(),
            'domains'=>$this->domains,
            'objects'=>$this->objects,
            'views'=>$this->views,
            'facets'=>$this->facets,
            'actions'=>$this->actions,
            'authority'=>'presentation-policy-only',
        ];
    }
}
