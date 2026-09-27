<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class WorkforceProviderStatus
{
    public function __construct(
        public readonly int|string $companyId,
        public readonly string $providerKey,
        public readonly string $healthState,
        public readonly string $reasonCode,
        public readonly int $observedAt,
        public readonly int $expiresAt,
        public readonly int $capabilityCount,
    ) {}

    public function toArray(): array
    {
        return [
            'company_id' => $this->companyId,
            'provider_key' => $this->providerKey,
            'health_state' => $this->healthState,
            'reason_code' => $this->reasonCode,
            'observed_at' => $this->observedAt,
            'expires_at' => $this->expiresAt,
            'capability_count' => $this->capabilityCount,
        ];
    }
}
