<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Decision;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Decision\DecisionProviderResult;

interface DecisionProviderContract
{
    /** @param array<string,mixed> $criteria */
    public function fetch(InterfaceContext $context, string $providerKey, array $criteria = []): DecisionProviderResult;
}
