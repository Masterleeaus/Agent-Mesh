<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final readonly class NearbySearchRequest
{
    public function __construct(
        public Coordinates $center,
        public float $radiusMetres,
        public array $includedTypes = [],
        public int $maximumResults = 20,
        public string $languageCode = 'en',
        public ?string $regionCode = null,
        public string $rankPreference = 'POPULARITY',
    ) {
        if ($radiusMetres <= 0 || $radiusMetres > 50000) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_RADIUS', 'Nearby search radius must be greater than zero and no more than 50,000 metres.');
        }
        if ($maximumResults < 1 || $maximumResults > 20) {
            throw MapsIntelligenceException::fromCode('MAPS_SEARCH_LIMIT_EXCEEDED', 'Nearby search page size must be between 1 and 20.');
        }
        if (! in_array($rankPreference, ['POPULARITY', 'DISTANCE'], true)) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_RANKING', 'Nearby rank preference must be POPULARITY or DISTANCE.');
        }
    }
}
