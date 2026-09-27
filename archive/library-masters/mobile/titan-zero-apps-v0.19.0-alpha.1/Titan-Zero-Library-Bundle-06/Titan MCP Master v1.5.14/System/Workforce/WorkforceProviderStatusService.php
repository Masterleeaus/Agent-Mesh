<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class WorkforceProviderStatusService
{
    public function __construct(
        private readonly WorkforceProviderRuntimeContract $provider,
        private readonly ProviderHealthStoreContract $store,
    ) {}

    public function status(int|string $companyId, int $now): WorkforceProviderStatus
    {
        $snapshot = $this->store->get($companyId, $this->provider->providerKey(), $now)
            ?? new ProviderHealthSnapshot($companyId, $this->provider->providerKey(), 'unavailable', 'missing_or_stale_health', $now, $now + 1);

        return new WorkforceProviderStatus(
            $companyId,
            $this->provider->providerKey(),
            $snapshot->state,
            $snapshot->reasonCode,
            $snapshot->observedAt,
            $snapshot->expiresAt,
            count($this->provider->capabilities()),
        );
    }
}
