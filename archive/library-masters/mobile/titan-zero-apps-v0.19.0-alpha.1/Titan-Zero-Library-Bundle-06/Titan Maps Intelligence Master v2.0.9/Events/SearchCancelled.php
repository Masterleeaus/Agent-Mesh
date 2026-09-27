<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Events;

final readonly class SearchCancelled extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.search_cancelled'; }
}
