<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Registry\ViewDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ViewRegistrySnapshot;

interface ViewRegistryContract
{
    /** @param array<string, array<string, mixed>> $contributions */
    public function rebuild(array $contributions): ViewRegistrySnapshot;
    public function find(string $key): ?ViewDescriptor;
    /** @return list<ViewDescriptor> */
    public function forObject(string $objectKey): array;
    public function snapshot(): ViewRegistrySnapshot;
}
