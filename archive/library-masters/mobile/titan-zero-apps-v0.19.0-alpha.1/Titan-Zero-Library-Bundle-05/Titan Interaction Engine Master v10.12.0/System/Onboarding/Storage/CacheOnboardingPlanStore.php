<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding\Storage;

use App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlan;
use Illuminate\Contracts\Cache\Repository;

final class CacheOnboardingPlanStore implements OnboardingPlanStoreInterface
{
    public function __construct(private readonly Repository $cache, private readonly int $ttlSeconds = 86400) {}

    public function put(OnboardingPlan $plan): void
    {
        $this->cache->put($this->key($plan->companyId, $plan->id), $plan->toArray(), $this->ttlSeconds);
    }

    public function get(string $companyId, string $planId): ?OnboardingPlan
    {
        $companyId = trim($companyId);
        $planId = trim($planId);
        if ($companyId === '' || $planId === '') return null;
        $value = $this->cache->get($this->key($companyId, $planId));
        if (!is_array($value)) return null;
        $plan = OnboardingPlan::fromArray($value);
        return hash_equals($companyId, $plan->companyId) ? $plan : null;
    }

    public function forget(string $companyId, string $planId): void
    {
        $this->cache->forget($this->key($companyId, $planId));
    }

    private function key(string $companyId, string $planId): string
    {
        return 'interaction-engine:onboarding:' . hash('sha256', $companyId) . ':' . $planId;
    }
}
