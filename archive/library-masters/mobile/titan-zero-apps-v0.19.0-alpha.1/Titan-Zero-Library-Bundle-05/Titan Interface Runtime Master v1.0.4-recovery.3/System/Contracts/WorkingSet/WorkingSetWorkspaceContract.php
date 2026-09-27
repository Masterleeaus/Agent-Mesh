<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\WorkingSetWorkspaceSnapshot;

interface WorkingSetWorkspaceContract
{
    public function open(string $workingSetId, InterfaceContext $context): WorkingSetWorkspaceSnapshot;
}
