<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Events;
final readonly class TerritoryConflictDetected extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.territory.conflict'; }
}
