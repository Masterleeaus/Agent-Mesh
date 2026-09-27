<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class ProviderHealthSnapshot
{
    public function __construct(
        public readonly int|string $companyId,
        public readonly string $providerKey,
        public readonly string $state,
        public readonly string $reasonCode,
        public readonly int $observedAt,
        public readonly int $expiresAt,
    ) {
        if (!in_array($state, ['healthy','degraded','unavailable','blocked'], true)) {
            throw new \InvalidArgumentException('Invalid provider health state.');
        }
        if ($expiresAt <= $observedAt) {
            throw new \InvalidArgumentException('Health expiry must be after observation.');
        }
    }

    public function isFresh(int $now): bool { return $now < $this->expiresAt; }
}
