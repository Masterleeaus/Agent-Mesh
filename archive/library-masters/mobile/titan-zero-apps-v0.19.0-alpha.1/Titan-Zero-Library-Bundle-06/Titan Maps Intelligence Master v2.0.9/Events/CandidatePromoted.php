<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Events;

final readonly class CandidatePromoted extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.candidate_promoted'; }
}
