<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Context;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

interface InterfaceContextStoreContract
{
    public function current(): ?InterfaceContext;

    public function requireCurrent(): InterfaceContext;

    public function set(InterfaceContext $context): void;

    public function clear(): void;
}
