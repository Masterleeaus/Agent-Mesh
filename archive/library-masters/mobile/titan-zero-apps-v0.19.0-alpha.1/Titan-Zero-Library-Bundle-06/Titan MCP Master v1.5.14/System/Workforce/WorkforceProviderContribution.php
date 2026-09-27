<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class WorkforceProviderContribution
{
    public function __construct(
        public readonly WorkforceProviderRuntimeContract $provider,
        public readonly ProviderHealthStoreContract $healthStore,
        public readonly CapabilityResolver $resolver,
        public readonly ProviderSelector $selector,
    ) {}

    public function descriptor(): array
    {
        return [
            'provider_key' => $this->provider->providerKey(),
            'scope_key' => $this->provider->companyScopeKey(),
            'capabilities' => $this->provider->capabilities(),
            'fail_closed' => true,
        ];
    }
}
