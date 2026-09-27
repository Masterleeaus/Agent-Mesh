<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Events;
final readonly class RouteFallbackUsed extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.route.fallback_used'; }
}
