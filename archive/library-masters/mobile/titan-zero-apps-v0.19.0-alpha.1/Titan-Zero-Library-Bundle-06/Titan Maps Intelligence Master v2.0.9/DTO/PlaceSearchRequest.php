<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final readonly class PlaceSearchRequest
{
    public string $query;

    public function __construct(
        string $query,
        public int $maximumResults = 20,
        public string $languageCode = 'en',
        public ?string $regionCode = null,
        public ?Coordinates $locationBias = null,
        public ?float $radiusMetres = null,
        public ?string $includedType = null,
        public bool $openNow = false,
        public ?float $minimumRating = null,
        public ?string $pageToken = null,
    ) {
        $this->query = trim($query);
        if ($this->query === '') {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_SEARCH', 'A non-empty place search query is required.');
        }
        if ($maximumResults < 1 || $maximumResults > 100) {
            throw MapsIntelligenceException::fromCode('MAPS_SEARCH_LIMIT_EXCEEDED', 'Search result limit must be between 1 and 100.');
        }
        if ($radiusMetres !== null && ($radiusMetres <= 0 || $radiusMetres > 50000)) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_RADIUS', 'Search radius must be greater than zero and no more than 50,000 metres.');
        }
        if ($minimumRating !== null && ($minimumRating < 0 || $minimumRating > 5)) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_RATING', 'Minimum rating must be between zero and five.');
        }
    }
}
