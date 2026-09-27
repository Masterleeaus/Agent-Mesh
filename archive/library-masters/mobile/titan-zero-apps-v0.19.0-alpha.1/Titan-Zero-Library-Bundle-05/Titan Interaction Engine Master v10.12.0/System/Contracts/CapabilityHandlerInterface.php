<?php

namespace App\Extensions\InteractionEngine\System\Contracts;

interface CapabilityHandlerInterface
{
    public function handle(string $capability, array $payload): void;
}
