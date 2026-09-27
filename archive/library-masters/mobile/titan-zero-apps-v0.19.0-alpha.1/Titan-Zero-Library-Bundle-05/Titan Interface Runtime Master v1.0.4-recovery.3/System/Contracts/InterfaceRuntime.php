<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts;

use App\Extensions\TitanInterfaceRuntime\System\Value\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Value\PresentationResult;
interface InterfaceRuntime
{
    /** @param array<string,mixed> $spec */
    public function execute(array $spec, InterfaceContext $context): PresentationResult;
}
