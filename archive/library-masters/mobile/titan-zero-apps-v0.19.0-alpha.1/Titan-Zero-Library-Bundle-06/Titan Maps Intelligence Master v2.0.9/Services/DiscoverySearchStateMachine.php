<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Enums\SearchStatus;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final class DiscoverySearchStateMachine
{
    private const TRANSITIONS = [
        'draft' => ['queued', 'cancelled'],
        'queued' => ['running', 'cancelled', 'failed'],
        'running' => ['paused', 'completed', 'partially_completed', 'failed', 'cancelled'],
        'paused' => ['queued', 'cancelled'],
        'partially_completed' => ['queued', 'completed', 'cancelled'],
        'failed' => ['queued', 'cancelled'],
        'completed' => [],
        'cancelled' => [],
    ];

    public static function canTransition(SearchStatus $from, SearchStatus $to): bool
    {
        return in_array($to->value, self::TRANSITIONS[$from->value] ?? [], true);
    }

    public static function assertTransition(SearchStatus $from, SearchStatus $to): void
    {
        if (! self::canTransition($from, $to)) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_SEARCH_TRANSITION', 'The requested discovery-search state transition is not allowed.', ['from' => $from->value, 'to' => $to->value]);
        }
    }
}
