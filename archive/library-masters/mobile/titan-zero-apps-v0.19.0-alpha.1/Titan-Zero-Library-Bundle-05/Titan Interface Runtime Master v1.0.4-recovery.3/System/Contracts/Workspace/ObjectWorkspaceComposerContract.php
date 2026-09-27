<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Workspace;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Workspace\ObjectWorkspace;

interface ObjectWorkspaceComposerContract
{
    public function compose(ObjectReference $reference, InterfaceContext $context): ObjectWorkspace;
}
