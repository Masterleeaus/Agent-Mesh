<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Events;

final readonly class TerritoryAnalysisCompleted extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.territory_analysis_completed'; }
}
