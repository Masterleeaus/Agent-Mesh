<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;

final readonly class WorkerLocationIngestionResult
{
    public function __construct(
        public bool $stored,
        public bool $debounced,
        public MapLocation $latestLocation,
        public ?MapLocationPing $ping = null,
    ) {}
}
