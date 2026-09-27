<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkProviderResult;

interface GlobalWorkProviderContract
{
    public function fetch(InterfaceContext $context, string $tray, int $limit): GlobalWorkProviderResult;
}
