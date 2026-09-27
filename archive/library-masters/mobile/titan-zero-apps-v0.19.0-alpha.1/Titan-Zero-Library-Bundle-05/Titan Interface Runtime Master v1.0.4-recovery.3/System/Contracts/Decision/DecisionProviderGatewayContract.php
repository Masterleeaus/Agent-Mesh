<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Decision;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Decision\DecisionProviderResult;
use App\Extensions\TitanInterfaceRuntime\System\Registry\DecisionProviderDescriptor;

interface DecisionProviderGatewayContract
{
    /** @param array<string,mixed> $criteria */
    public function fetch(DecisionProviderDescriptor $descriptor, InterfaceContext $context, array $criteria = []): DecisionProviderResult;
}
