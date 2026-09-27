<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final readonly class Coordinates
{
    public function __construct(public float $latitude, public float $longitude)
    {
        if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_COORDINATES', 'Coordinates are outside valid latitude or longitude bounds.');
        }
    }

    public function toArray(): array
    {
        return ['latitude' => $this->latitude, 'longitude' => $this->longitude];
    }
}
