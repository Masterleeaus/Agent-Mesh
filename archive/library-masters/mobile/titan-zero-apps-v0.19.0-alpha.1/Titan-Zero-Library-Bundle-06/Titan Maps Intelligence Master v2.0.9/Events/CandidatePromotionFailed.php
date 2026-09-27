<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Events;

final readonly class CandidatePromotionFailed extends MapsDomainEvent
{
    public static function eventName(): string { return 'maps.candidate_promotion_failed'; }
}
