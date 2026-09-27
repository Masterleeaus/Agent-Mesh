<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Events;
final readonly class ServiceAreaExcluded extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.service_area.excluded'; }
}
