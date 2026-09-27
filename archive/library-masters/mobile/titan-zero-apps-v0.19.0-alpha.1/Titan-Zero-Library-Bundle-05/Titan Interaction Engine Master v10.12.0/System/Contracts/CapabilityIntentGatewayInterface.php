<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Contracts;
interface CapabilityIntentGatewayInterface
{
    /** @param array<string,mixed> $payload @param array<string,mixed> $trustedContext @return array<string,mixed> */
    public function dispatch(string $capability, array $payload, array $trustedContext): array;
}
