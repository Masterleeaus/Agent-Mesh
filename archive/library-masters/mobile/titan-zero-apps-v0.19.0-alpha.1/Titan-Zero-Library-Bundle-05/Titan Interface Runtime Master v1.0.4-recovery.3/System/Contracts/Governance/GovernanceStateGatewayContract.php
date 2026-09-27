<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernanceStateResult;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ResolvedObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionDescriptor;

interface GovernanceStateGatewayContract
{
    public function inspect(
        ActionDescriptor $action,
        ResolvedObjectReference $object,
        InterfaceContext $context,
        ?string $receiptId = null,
        ?string $approvalId = null,
    ): GovernanceStateResult;

    /** @return array<string,mixed> */
    public function health(): array;
}
