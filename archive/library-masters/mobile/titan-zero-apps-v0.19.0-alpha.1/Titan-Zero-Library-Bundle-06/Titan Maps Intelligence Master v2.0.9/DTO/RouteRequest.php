<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final readonly class RouteRequest
{
    private const TRAVEL_MODES = ['DRIVE', 'WALK', 'BICYCLE', 'TWO_WHEELER', 'TRANSIT'];
    private const ROUTING_PREFERENCES = ['TRAFFIC_UNAWARE', 'TRAFFIC_AWARE', 'TRAFFIC_AWARE_OPTIMAL'];

    public function __construct(
        public Coordinates $origin,
        public Coordinates $destination,
        public string $travelMode = 'DRIVE',
        public string $routingPreference = 'TRAFFIC_AWARE',
        public ?string $departureTime = null,
        public ?string $languageCode = null,
        public ?string $workerPublicId = null,
        public ?string $customerPublicId = null,
        public ?string $originReferenceType = null,
        public ?string $originPublicReferenceId = null,
        public ?string $destinationReferenceType = null,
        public ?string $destinationPublicReferenceId = null,
    ) {
        if (! in_array($travelMode, self::TRAVEL_MODES, true)) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_TRAVEL_MODE', 'Unsupported travel mode.', ['travel_mode' => $travelMode]);
        }
        if (! in_array($routingPreference, self::ROUTING_PREFERENCES, true)) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_ROUTING_PREFERENCE', 'Unsupported routing preference.', ['routing_preference' => $routingPreference]);
        }
    }

    public function isTrafficAware(): bool
    {
        return $this->routingPreference !== 'TRAFFIC_UNAWARE';
    }
}
