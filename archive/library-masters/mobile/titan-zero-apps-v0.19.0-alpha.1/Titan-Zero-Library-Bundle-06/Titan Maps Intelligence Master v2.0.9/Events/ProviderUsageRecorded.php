<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Events;

final readonly class ProviderUsageRecorded extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.usage_recorded'; }
}
