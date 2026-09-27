<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernanceWorkspaceSnapshot;

interface GovernanceWorkspaceContract
{
    public function open(
        string $objectReference,
        string $actionKey,
        InterfaceContext $context,
        ?string $receiptId = null,
        ?string $approvalId = null,
    ): GovernanceWorkspaceSnapshot;
}
