<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Decision;

use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Decision\DecisionWorkspaceSnapshot;

interface DecisionWorkspaceContract
{
    public function open(string $objectKey, InterfaceContext $context, ReadQuery $query, ?string $requestedViewKey = null): DecisionWorkspaceSnapshot;
}
