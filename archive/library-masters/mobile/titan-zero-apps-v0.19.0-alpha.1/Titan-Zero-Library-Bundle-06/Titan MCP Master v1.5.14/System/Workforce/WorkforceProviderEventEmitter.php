<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class WorkforceProviderEventEmitter
{
    public function __construct(private readonly object $dispatcher) {}

    public function healthObserved(ProviderHealthSnapshot $snapshot): void
    {
        $this->dispatcher->dispatch('workforce.provider.health.observed', [[
            'company_id' => $snapshot->companyId,
            'provider_key' => $snapshot->providerKey,
            'state' => $snapshot->state,
            'reason_code' => $snapshot->reasonCode,
            'observed_at' => $snapshot->observedAt,
            'expires_at' => $snapshot->expiresAt,
        ]]);
    }

    public function availabilityChanged(int|string $companyId, string $providerKey, string $previous, string $current, string $reasonCode, int $observedAt): void
    {
        $this->dispatcher->dispatch('workforce.provider.availability.changed', [[
            'company_id' => $companyId,
            'provider_key' => $providerKey,
            'previous_state' => $previous,
            'current_state' => $current,
            'reason_code' => $reasonCode,
            'observed_at' => $observedAt,
        ]]);
    }
}
