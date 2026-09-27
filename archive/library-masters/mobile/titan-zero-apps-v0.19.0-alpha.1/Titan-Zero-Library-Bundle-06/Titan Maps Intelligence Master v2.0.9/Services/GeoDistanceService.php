<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

final class GeoDistanceService
{
    public function kilometres(float $latitudeA, float $longitudeA, float $latitudeB, float $longitudeB): float
    {
        $earthRadiusKm = 6371.0088;
        $latA = deg2rad($latitudeA);
        $latB = deg2rad($latitudeB);
        $deltaLat = $latB - $latA;
        $deltaLon = deg2rad($longitudeB - $longitudeA);
        $haversine = sin($deltaLat / 2) ** 2 + cos($latA) * cos($latB) * sin($deltaLon / 2) ** 2;
        return $earthRadiusKm * 2 * atan2(sqrt($haversine), sqrt(max(0.0, 1.0 - $haversine)));
    }
}
