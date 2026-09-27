<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final readonly class GeocodeRequest
{
    public function __construct(
        public string $address,
        public ?string $languageCode = null,
        public ?string $regionCode = null,
    ) {
        if (trim($address) === '') {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_ADDRESS', 'A non-empty address is required for geocoding.');
        }
    }
}
