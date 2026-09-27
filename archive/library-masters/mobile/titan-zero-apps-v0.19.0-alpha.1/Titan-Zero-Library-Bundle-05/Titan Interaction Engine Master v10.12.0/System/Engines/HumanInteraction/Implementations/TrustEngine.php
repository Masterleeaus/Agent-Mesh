<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations;

use App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\TrustEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use Illuminate\Support\Facades\Cache;

class TrustEngine implements TrustEngineInterface
{
    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
    }
    public function getTrustScore(int $userId): float
    {
        return Cache::get($this->tenantContext->cacheKey('trust:' . $userId), 0.5);
    }

    public function updateTrust(int $userId, string $event): void
    {
        $score = $this->getTrustScore($userId);
        $change = match ($event) {
            'success' => 0.1,
            'failure' => -0.1,
            'correction' => 0.2,
            default => 0,
        };
        $score = min(max($score + $change, 0), 1);
        Cache::put($this->tenantContext->cacheKey('trust:' . $userId), $score, 86400 * 30);

        $counts = Cache::get($this->tenantContext->cacheKey('trust_events:' . $userId), ['success' => 0, 'failure' => 0, 'correction' => 0]);
        if (isset($counts[$event])) {
            $counts[$event]++;
            Cache::put($this->tenantContext->cacheKey('trust_events:' . $userId), $counts, 86400 * 30);
        }
    }

    public function getTrustFactors(int $userId): array
    {
        // Fixed during the fix pass: previously returned the identical
        // accuracy=0.8/reliability=0.7/transparency=0.9 for every user.
        // Derives real per-factor scores from this user's actual recorded
        // event history instead.
        $counts = Cache::get($this->tenantContext->cacheKey('trust_events:' . $userId), ['success' => 0, 'failure' => 0, 'correction' => 0]);
        $total = array_sum($counts) ?: 1;

        return [
            'accuracy' => round(1 - ($counts['failure'] / $total), 2),
            'reliability' => round($counts['success'] / $total, 2),
            'transparency' => round(($counts['success'] + $counts['correction']) / $total, 2),
        ];
    }
}
