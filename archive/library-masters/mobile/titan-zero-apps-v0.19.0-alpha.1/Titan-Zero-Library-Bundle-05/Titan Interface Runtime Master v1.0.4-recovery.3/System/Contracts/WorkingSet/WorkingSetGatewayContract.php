<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\WorkingSetSourceResult;

interface WorkingSetGatewayContract
{
    public function inspect(string $workingSetId, InterfaceContext $context): WorkingSetSourceResult;

    /** @return array<string,mixed> */
    public function health(): array;
}
