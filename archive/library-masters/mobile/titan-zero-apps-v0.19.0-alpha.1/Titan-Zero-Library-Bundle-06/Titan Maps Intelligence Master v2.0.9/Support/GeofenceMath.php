<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Support;

use InvalidArgumentException;

final class GeofenceMath
{
    public function circleContains(float $centerLat, float $centerLng, float $radiusMetres, float $latitude, float $longitude, float $accuracyMetres = 0.0, ?bool $currentlyInside = null, float $hysteresisMetres = 0.0): bool
    {
        if ($radiusMetres <= 0) return false;
        $distance = $this->distanceMetres($centerLat, $centerLng, $latitude, $longitude);
        if ($currentlyInside === true) {
            return max(0.0, $distance - max(0.0, $accuracyMetres)) <= $radiusMetres + max(0.0, $hysteresisMetres);
        }
        return $distance + max(0.0, $accuracyMetres) <= max(0.0, $radiusMetres - max(0.0, $hysteresisMetres));
    }

    /** @param array<int,mixed> $points @return array<int,array{lat:float,lng:float}> */
    public function validatePolygon(array $points): array
    {
        $normalised = [];
        foreach ($points as $point) {
            if (! is_array($point) || ! isset($point['lat'], $point['lng']) || ! is_numeric($point['lat']) || ! is_numeric($point['lng'])) {
                throw new InvalidArgumentException('Polygon points require numeric lat/lng values.');
            }
            $lat = (float) $point['lat']; $lng = (float) $point['lng'];
            if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) throw new InvalidArgumentException('Polygon point is outside valid coordinate bounds.');
            $normalised[] = ['lat' => $lat, 'lng' => $lng];
        }
        if (count($normalised) < 3) throw new InvalidArgumentException('Polygon geofences require at least three points.');
        return $normalised;
    }

    /** @param array<int,mixed> $points */
    public function pointInPolygon(float $latitude, float $longitude, array $points): bool
    {
        try { $points = $this->validatePolygon($points); } catch (InvalidArgumentException) { return false; }
        $inside = false; $count = count($points); $j = $count - 1;
        for ($i = 0; $i < $count; $i++) {
            $yi = $points[$i]['lat']; $xi = $points[$i]['lng'];
            $yj = $points[$j]['lat']; $xj = $points[$j]['lng'];
            $intersects = (($yi > $latitude) !== ($yj > $latitude))
                && ($longitude < ($xj - $xi) * ($latitude - $yi) / (($yj - $yi) ?: 1e-12) + $xi);
            if ($intersects) $inside = ! $inside;
            $j = $i;
        }
        return $inside;
    }

    public function distanceMetres(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earth = 6371008.8;
        $phi1 = deg2rad($lat1); $phi2 = deg2rad($lat2);
        $dPhi = deg2rad($lat2 - $lat1); $dLambda = deg2rad($lon2 - $lon1);
        $a = sin($dPhi / 2) ** 2 + cos($phi1) * cos($phi2) * sin($dLambda / 2) ** 2;
        return $earth * 2 * atan2(sqrt($a), sqrt(max(0.0, 1.0 - $a)));
    }
}
