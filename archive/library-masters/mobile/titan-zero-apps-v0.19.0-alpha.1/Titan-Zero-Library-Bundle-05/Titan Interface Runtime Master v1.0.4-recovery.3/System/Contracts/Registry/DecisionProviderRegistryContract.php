<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Registry\DecisionProviderDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\DecisionProviderRegistrySnapshot;

interface DecisionProviderRegistryContract
{
    /** @param array<string,array<string,mixed>> $contributions */
    public function rebuild(array $contributions): DecisionProviderRegistrySnapshot;

    /** @return list<DecisionProviderDescriptor> */
    public function forObject(string $objectKey): array;

    public function snapshot(): DecisionProviderRegistrySnapshot;
}
