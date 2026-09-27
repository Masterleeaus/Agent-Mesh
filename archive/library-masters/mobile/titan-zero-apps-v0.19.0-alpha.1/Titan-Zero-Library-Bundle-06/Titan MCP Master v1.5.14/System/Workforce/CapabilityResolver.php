<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class CapabilityResolver
{
    public function __construct(private readonly ProviderHealthRegistry $health) {}

    public function resolve(
        WorkforceProviderRuntimeContract $provider,
        int|string $companyId,
        string $capability,
        int $now,
        bool $policyEnabled,
        bool $authorityAllowed,
        bool $dependenciesHealthy = true,
    ): CapabilityAvailability {
        if (!$provider->supports($capability)) {
            return new CapabilityAvailability($provider->providerKey(), $capability, 'unavailable', 'capability_not_published');
        }
        if (!$policyEnabled) {
            return new CapabilityAvailability($provider->providerKey(), $capability, 'policy_disabled', 'policy_disabled');
        }
        if (!$authorityAllowed) {
            return new CapabilityAvailability($provider->providerKey(), $capability, 'blocked', 'authority_denied');
        }
        if (!$dependenciesHealthy) {
            return new CapabilityAvailability($provider->providerKey(), $capability, 'unavailable', 'dependency_unavailable');
        }
        $health = $this->health->current($companyId, $provider->providerKey(), $now);
        return match ($health->state) {
            'healthy' => new CapabilityAvailability($provider->providerKey(), $capability, 'available', 'provider_healthy'),
            'degraded' => new CapabilityAvailability($provider->providerKey(), $capability, 'degraded', $health->reasonCode),
            'blocked' => new CapabilityAvailability($provider->providerKey(), $capability, 'blocked', $health->reasonCode),
            default => new CapabilityAvailability($provider->providerKey(), $capability, 'unavailable', $health->reasonCode),
        };
    }
}
