<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Registry\LegacyDataSurfaceDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\LegacyDataSurfaceRegistrySnapshot;

interface LegacyDataSurfaceRegistryContract
{
    /** @param array<string,array<string,mixed>> $contributions */
    public function rebuild(array $contributions): LegacyDataSurfaceRegistrySnapshot;
    public function find(string $key): ?LegacyDataSurfaceDescriptor;
    /** @return list<LegacyDataSurfaceDescriptor> */
    public function forObject(string $objectKey): array;
    public function snapshot(): LegacyDataSurfaceRegistrySnapshot;
}
