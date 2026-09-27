<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\PublicApi;

use App\Extensions\InteractionEngine\System\Registry\CapabilityRegistry;

final class ProviderCapabilityRegistryGateway
{
    public function __construct(private readonly CapabilityRegistry $registry) {}

    public function registerProviderCapability(string $provider, string $capability, callable $handler): void
    {
        $provider = trim($provider); $capability = trim($capability);
        if ($provider === '' || $capability === '') throw new \InvalidArgumentException('provider and capability are required.');
        $this->registry->register($capability, $handler, false);
    }
}
