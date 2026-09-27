<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Receipts\InterfaceReceipt;

interface GovernedActionDispatcherContract
{
    /**
     * Dispatches a declared capability or Interaction Engine reference.
     * Implementations MUST NOT directly mutate authoritative business persistence.
     *
     * @param array<string, mixed> $payload
     */
    public function dispatch(
        InterfaceContext $context,
        string $actionRef,
        array $payload = [],
    ): InterfaceReceipt;
}
