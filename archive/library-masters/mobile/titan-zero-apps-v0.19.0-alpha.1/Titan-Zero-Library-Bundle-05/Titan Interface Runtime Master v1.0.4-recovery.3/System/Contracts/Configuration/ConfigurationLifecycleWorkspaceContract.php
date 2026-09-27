<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Configuration;

use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Configuration\ConfigurationLifecycleWorkspaceSnapshot;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;

interface ConfigurationLifecycleWorkspaceContract
{
    public function open(ObjectReference $reference, InterfaceContext $context, ReadQuery $query, ?string $requestedViewKey = null): ConfigurationLifecycleWorkspaceSnapshot;
}
