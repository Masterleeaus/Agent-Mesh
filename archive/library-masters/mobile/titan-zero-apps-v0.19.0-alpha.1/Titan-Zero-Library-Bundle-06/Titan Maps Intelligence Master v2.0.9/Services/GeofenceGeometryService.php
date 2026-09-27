<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Models\MapGeofence;
use App\Extensions\TitanMapsIntelligence\Support\GeofenceMath;
use InvalidArgumentException;

final class GeofenceGeometryService
{
    public function __construct(private readonly GeofenceMath $math) {}

    public function contains(MapGeofence $geofence, float $latitude, float $longitude, float $accuracyMetres = 0.0, ?bool $currentlyInside = null, float $hysteresisMetres = 0.0): bool
    {
        return match ($geofence->shape_type) {
            'circle' => $geofence->center_latitude !== null && $geofence->center_longitude !== null
                ? $this->math->circleContains((float) $geofence->center_latitude, (float) $geofence->center_longitude, (float) $geofence->radius_metres, $latitude, $longitude, $accuracyMetres, $currentlyInside, $hysteresisMetres)
                : false,
            'polygon' => $this->math->pointInPolygon($latitude, $longitude, (array) ($geofence->geometry ?? [])),
            default => throw new InvalidArgumentException('Unsupported geofence shape type.'),
        };
    }

    public function validatePolygon(array $points): array { return $this->math->validatePolygon($points); }
    public function distanceMetres(float $lat1, float $lon1, float $lat2, float $lon2): float { return $this->math->distanceMetres($lat1, $lon1, $lat2, $lon2); }
}
