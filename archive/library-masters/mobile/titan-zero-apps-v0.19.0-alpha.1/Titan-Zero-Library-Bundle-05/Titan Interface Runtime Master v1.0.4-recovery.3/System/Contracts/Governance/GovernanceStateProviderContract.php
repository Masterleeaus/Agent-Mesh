<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernanceStateResult;

interface GovernanceStateProviderContract
{
    /**
     * Return authoritative governance state for the supplied subject.
     * Providers remain authoritative for risk, assurance, autonomy, approval,
     * execution, receipts and rollback availability.
     *
     * @param array<string,mixed> $subject
     */
    public function inspect(InterfaceContext $context, string $providerKey, array $subject): GovernanceStateResult;
}
