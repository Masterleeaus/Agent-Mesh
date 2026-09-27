<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Registry\GlobalWorkDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\GlobalWorkRegistrySnapshot;

interface GlobalWorkRegistryContract
{
    /** @param array<string,array<string,mixed>> $contributions */
    public function rebuild(array $contributions): GlobalWorkRegistrySnapshot;

    /** @return list<GlobalWorkDescriptor> */
    public function forTray(string $tray, string $productSurface): array;

    public function snapshot(): GlobalWorkRegistrySnapshot;
}
