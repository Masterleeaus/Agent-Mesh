<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Events;

final readonly class SearchCompleted extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.search_completed'; }
}
