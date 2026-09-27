<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;
use App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState;
use DateTimeImmutable;

final class WorkerLocationRetentionService
{
    public function __construct(private readonly MapsConfiguration $configuration) {}

    public function prune(?int $retentionDays = null): int
    {
        $profiles = ['transient'=>7, 'standard'=>90, 'forensic'=>2555];
        $days = $retentionDays ?? ($profiles[$this->configuration->workerRetentionPolicy()] ?? $this->configuration->locationRetentionDays());
        if ($days < 1 || $days > 3650) {
            throw new \InvalidArgumentException('Location retention days must be between 1 and 3650.');
        }

        $cutoff = (new DateTimeImmutable('now'))->modify('-'.$days.' days');
        MapWorkerTrackingState::query()
            ->whereNotNull('latest_captured_at')
            ->where('latest_captured_at', '<', $cutoff)
            ->update(['latest_location_ping_id' => null]);

        return MapLocationPing::query()->where(static function($q) use ($cutoff): void { $q->whereNotNull('retention_expires_at')->where('retention_expires_at','<',new DateTimeImmutable('now'))->orWhere(static fn($inner)=>$inner->whereNull('retention_expires_at')->where('captured_at','<',$cutoff)); })->delete();
    }
}
