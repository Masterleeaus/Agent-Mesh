<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Registry\DomainDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\DomainRegistrySnapshot;

interface DomainRegistryContract
{
    /** @param array<string,array<string,mixed>> $contributions */
    public function rebuild(array $contributions): DomainRegistrySnapshot;

    public function snapshot(): DomainRegistrySnapshot;

    /** @return array<string,DomainDescriptor> */
    public function all(): array;

    public function get(string $domainKey): ?DomainDescriptor;

    /** @return array<string,DomainDescriptor> */
    public function visibleFor(string $productSurface): array;
}
