<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class ProviderHealthRefreshService
{
    public function __construct(
        private readonly ProviderHealthProbeContract $probe,
        private readonly ProviderHealthStoreContract $store,
        private readonly WorkforceProviderEventEmitter $events,
    ) {}

    public function refresh(int|string $companyId, int $now): ProviderHealthSnapshot
    {
        $snapshot = $this->probe->probe($companyId, $now);
        $providerKey = $snapshot->providerKey;
        $previousState = 'unavailable';

        $existing = $this->store->get($companyId, $providerKey, $now);
        if ($existing instanceof ProviderHealthSnapshot) {
            $previousState = $existing->state;
        }

        $this->store->put($snapshot);
        $this->events->healthObserved($snapshot);

        if ($previousState !== $snapshot->state) {
            $this->events->availabilityChanged(
                $companyId,
                $providerKey,
                $previousState,
                $snapshot->state,
                $snapshot->reasonCode,
                $now
            );
        }

        return $snapshot;
    }
}
