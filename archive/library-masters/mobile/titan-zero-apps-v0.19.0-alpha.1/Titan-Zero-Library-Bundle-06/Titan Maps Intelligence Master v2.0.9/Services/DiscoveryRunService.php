<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Models\DiscoveryRun;

final class DiscoveryRunService
{
    public function begin(string $companyId, string $searchId, string $provider): DiscoveryRun
    {
        return DiscoveryRun::query()->firstOrCreate([
            'company_id' => $companyId,
            'discovery_search_id' => $searchId,
            'provider' => $provider,
        ], [
            'current_stage' => 'running',
            'attempts' => 0,
            'started_at' => now(),
        ]);
    }

    public function checkpoint(DiscoveryRun $run, array $changes): void
    {
        $allowed = array_intersect_key($changes, array_flip([
            'cursor', 'current_stage', 'attempts', 'results_discovered', 'results_processed',
            'results_skipped', 'duplicates_detected', 'failures', 'rate_limit_state', 'retry_after',
            'checkpoint', 'completed_at', 'failure_code', 'safe_failure_details',
        ]));
        $run->forceFill($allowed)->save();
    }
}
