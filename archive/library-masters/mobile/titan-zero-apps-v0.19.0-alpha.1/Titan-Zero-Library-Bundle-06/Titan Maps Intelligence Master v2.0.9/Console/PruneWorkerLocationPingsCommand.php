<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Console;

use App\Extensions\TitanMapsIntelligence\Services\WorkerLocationRetentionService;
use Illuminate\Console\Command;

final class PruneWorkerLocationPingsCommand extends Command
{
    protected $signature = 'titan-maps:prune-location-pings {--days= : Override configured retention days} {--policy= : transient|standard|forensic retention profile}';
    protected $description = 'Prune retained Titan Maps worker GPS history while preserving each worker latest MapLocation projection.';

    public function handle(WorkerLocationRetentionService $retention): int
    {
        $option = $this->option('days');
        $policy = (string) ($this->option('policy') ?? '');
        $profiles = ['transient'=>7, 'standard'=>90, 'forensic'=>2555];
        $days = $option === null || $option === '' ? ($policy !== '' ? ($profiles[$policy] ?? throw new \InvalidArgumentException('Unknown retention policy.')) : null) : (int) $option;
        $deleted = $retention->prune($days);
        $this->info("Pruned {$deleted} worker location ping(s).");
        return self::SUCCESS;
    }
}
