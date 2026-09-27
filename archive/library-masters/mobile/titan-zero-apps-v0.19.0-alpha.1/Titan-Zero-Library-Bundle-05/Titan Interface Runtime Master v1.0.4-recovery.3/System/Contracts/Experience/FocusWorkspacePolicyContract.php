<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Experience\FocusWorkspaceProfile;

interface FocusWorkspacePolicyContract
{
    public function project(InterfaceContext $context, string $targetKind, string $targetReference): FocusWorkspaceProfile;
}
