<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Interaction;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionSnapshot;

interface InteractionEngineGatewayContract
{
    public function available(): bool;

    public function session(InterfaceContext $context, string $sessionId): InteractionSnapshot;

    /** @return array<string,mixed> */
    public function health(): array;
}
