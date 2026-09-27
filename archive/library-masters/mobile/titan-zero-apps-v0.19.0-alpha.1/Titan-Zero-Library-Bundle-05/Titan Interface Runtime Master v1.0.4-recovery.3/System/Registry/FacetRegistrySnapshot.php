<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

final readonly class FacetRegistrySnapshot implements \JsonSerializable
{
    /**
     * @param array<string,FacetDescriptor> $facets
     * @param array<string,list<string>> $byObject
     * @param array<string,list<string>> $collisions
     * @param array<string,list<string>> $rejected
     */
    public function __construct(
        public array $facets = [],
        public array $byObject = [],
        public array $collisions = [],
        public array $rejected = [],
    ) {
    }

    public function jsonSerialize(): array
    {
        return [
            'summary' => [
                'active_facets' => count($this->facets),
                'enriched_objects' => count($this->byObject),
                'collisions' => count($this->collisions),
                'rejected_contributors' => count($this->rejected),
            ],
            'facets' => array_map(static fn (FacetDescriptor $facet): array => $facet->jsonSerialize(), $this->facets),
            'by_object' => $this->byObject,
            'collisions' => $this->collisions,
            'rejected' => $this->rejected,
        ];
    }
}
