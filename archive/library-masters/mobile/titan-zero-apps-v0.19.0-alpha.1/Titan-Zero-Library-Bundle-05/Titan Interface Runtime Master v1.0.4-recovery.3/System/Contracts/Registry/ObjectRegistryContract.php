<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ResolvedObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ObjectDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ObjectRegistrySnapshot;

interface ObjectRegistryContract
{
    /** @param array<string,array<string,mixed>> $contributions */
    public function rebuild(array $contributions): ObjectRegistrySnapshot;

    public function snapshot(): ObjectRegistrySnapshot;

    /** @return array<string,ObjectDescriptor> */
    public function all(): array;

    public function get(string $objectKey): ?ObjectDescriptor;

    /** @return array<string,ObjectDescriptor> */
    public function visibleFor(string $productSurface): array;

    public function resolve(ObjectReference $reference, InterfaceContext $context): ResolvedObjectReference;
}
