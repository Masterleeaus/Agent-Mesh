<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionRegistrySnapshot;

interface ActionRegistryContract
{
    /** @param array<string,array<string,mixed>> $contributions */
    public function rebuild(array $contributions): ActionRegistrySnapshot;

    public function snapshot(): ActionRegistrySnapshot;

    /** @return array<string,ActionDescriptor> */
    public function all(): array;

    public function get(string $actionKey): ?ActionDescriptor;

    /** @return array<string,ActionDescriptor> */
    public function forObject(string $objectKey, InterfaceContext $context): array;
}
