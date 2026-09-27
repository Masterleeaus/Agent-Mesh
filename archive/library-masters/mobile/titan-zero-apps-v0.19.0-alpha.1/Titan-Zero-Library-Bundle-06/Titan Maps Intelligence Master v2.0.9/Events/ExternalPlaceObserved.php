<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Events;

final readonly class ExternalPlaceObserved extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.external_place_observed'; }
}
