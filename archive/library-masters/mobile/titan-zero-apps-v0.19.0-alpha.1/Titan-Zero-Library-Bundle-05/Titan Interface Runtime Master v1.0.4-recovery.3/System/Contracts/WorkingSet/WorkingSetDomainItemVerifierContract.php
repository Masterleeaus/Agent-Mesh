<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

interface WorkingSetDomainItemVerifierContract
{
    public function verify(string $itemType, string $itemId, InterfaceContext $context): bool;
}
