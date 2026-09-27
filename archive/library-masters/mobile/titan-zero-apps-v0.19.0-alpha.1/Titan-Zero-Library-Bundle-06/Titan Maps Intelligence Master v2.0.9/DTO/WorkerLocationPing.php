<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use DateTimeImmutable;

final readonly class WorkerLocationPing
{
    public Coordinates $coordinates;

    public function __construct(
        float $latitude,
        float $longitude,
        public float $accuracyMetres,
        public DateTimeImmutable $capturedAt,
        public ?float $altitudeMetres = null,
        public ?float $speedMetresPerSecond = null,
        public ?float $headingDegrees = null,
        public array $motionMetadata = [],
    ) {
        $this->coordinates = new Coordinates($latitude, $longitude);
        if (! is_finite($accuracyMetres) || $accuracyMetres < 0.0) {
            throw MapsIntelligenceException::fromCode('MAPS_LOCATION_ACCURACY_INVALID', 'GPS accuracy must be a non-negative finite value.');
        }
        if ($altitudeMetres !== null && (! is_finite($altitudeMetres) || $altitudeMetres < -1000.0 || $altitudeMetres > 25000.0)) {
            throw MapsIntelligenceException::fromCode('MAPS_LOCATION_ALTITUDE_INVALID', 'GPS altitude is outside the supported range.');
        }
        if ($speedMetresPerSecond !== null && (! is_finite($speedMetresPerSecond) || $speedMetresPerSecond < 0.0 || $speedMetresPerSecond > 120.0)) {
            throw MapsIntelligenceException::fromCode('MAPS_LOCATION_SPEED_INVALID', 'GPS speed is outside the supported range.');
        }
        if ($headingDegrees !== null && (! is_finite($headingDegrees) || $headingDegrees < 0.0 || $headingDegrees > 360.0)) {
            throw MapsIntelligenceException::fromCode('MAPS_LOCATION_HEADING_INVALID', 'GPS heading must be between 0 and 360 degrees.');
        }
    }
}
