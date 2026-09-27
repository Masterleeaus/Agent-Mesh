<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkProviderResult;
use App\Extensions\TitanInterfaceRuntime\System\Registry\GlobalWorkDescriptor;

interface GlobalWorkProviderGatewayContract
{
    public function fetch(GlobalWorkDescriptor $descriptor, InterfaceContext $context, int $limit): GlobalWorkProviderResult;
}
