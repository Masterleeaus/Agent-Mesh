<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding\Storage;

use Illuminate\Contracts\Cache\Repository;

final class CacheOnboardingExecutionLedger implements OnboardingExecutionLedgerInterface
{
    public function __construct(private readonly Repository $cache, private readonly int $ttlSeconds = 604800) {}

    public function result(string $companyId, string $planId, string $actionId): ?array
    {
        $value = $this->cache->get($this->key($companyId, $planId, $actionId));
        return is_array($value) ? $value : null;
    }

    public function record(string $companyId, string $planId, string $actionId, array $result): void
    {
        $this->cache->put($this->key($companyId, $planId, $actionId), $result, $this->ttlSeconds);
    }

    private function key(string $companyId, string $planId, string $actionId): string
    {
        return 'interaction-engine:onboarding-ledger:' . hash('sha256', $companyId) . ':' . $planId . ':' . $actionId;
    }
}
