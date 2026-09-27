<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final readonly class RouteMatrixRequest
{
    public function __construct(
        public array $origins,
        public array $destinations,
        public string $travelMode = 'DRIVE',
        public string $routingPreference = 'TRAFFIC_AWARE',
        public ?string $departureTime = null,
    ) {
        if ($origins === [] || $destinations === []) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_ROUTE_MATRIX', 'A route matrix requires at least one origin and one destination.');
        }
        foreach (array_merge($origins, $destinations) as $coordinate) {
            if (! $coordinate instanceof Coordinates) {
                throw MapsIntelligenceException::fromCode('MAPS_INVALID_ROUTE_MATRIX', 'Route matrix points must be Coordinates instances.');
            }
        }
        new RouteRequest($origins[0], $destinations[0], $travelMode, $routingPreference, $departureTime);
    }

    public function elementCount(): int
    {
        return count($this->origins) * count($this->destinations);
    }

    public function isTrafficAware(): bool
    {
        return $this->routingPreference !== 'TRAFFIC_UNAWARE';
    }
}
