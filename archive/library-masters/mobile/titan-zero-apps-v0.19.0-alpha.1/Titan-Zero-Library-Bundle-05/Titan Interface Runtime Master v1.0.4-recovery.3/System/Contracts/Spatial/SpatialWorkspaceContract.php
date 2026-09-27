<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Spatial;

use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Spatial\SpatialWorkspaceSnapshot;

interface SpatialWorkspaceContract
{
    public function open(string $objectKey, InterfaceContext $context, ReadQuery $query, ?string $requestedViewKey = null): SpatialWorkspaceSnapshot;
}
