<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Registry\FacetDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\FacetRegistrySnapshot;

interface FacetRegistryContract
{
    /** @param array<string,array<string,mixed>> $contributions */
    public function rebuild(array $contributions): FacetRegistrySnapshot;

    public function snapshot(): FacetRegistrySnapshot;

    /** @return array<string,FacetDescriptor> */
    public function all(): array;

    public function get(string $facetKey): ?FacetDescriptor;

    /** @return array<string,FacetDescriptor> */
    public function forObject(string $objectKey, InterfaceContext $context): array;
}
