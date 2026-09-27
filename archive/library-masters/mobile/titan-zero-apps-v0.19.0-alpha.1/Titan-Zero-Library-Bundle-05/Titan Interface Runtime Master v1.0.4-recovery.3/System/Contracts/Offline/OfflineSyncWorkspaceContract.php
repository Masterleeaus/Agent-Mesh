<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Offline;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Offline\OfflineSyncWorkspaceSnapshot;

interface OfflineSyncWorkspaceContract
{
    public function compose(InterfaceContext $context, int $limit = 100): OfflineSyncWorkspaceSnapshot;
}
