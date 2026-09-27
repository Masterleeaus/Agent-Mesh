<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Events;

final readonly class ProviderRateLimited extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.provider_rate_limited'; }
}
