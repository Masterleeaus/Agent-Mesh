<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
final class TravelZoneRuleEvaluator
{
    public function matches(array $territory,array $routeEvidence): bool
    {
        return match((string)($territory['match_mode']??'')) {
            'road_distance' => isset($routeEvidence['road_distance_metres']) && is_numeric($routeEvidence['road_distance_metres']) && isset($territory['maximum_road_distance_metres']) && is_numeric($territory['maximum_road_distance_metres']) && (int)$routeEvidence['road_distance_metres'] <= (int)$territory['maximum_road_distance_metres'],
            'drive_time' => isset($routeEvidence['duration_seconds']) && is_numeric($routeEvidence['duration_seconds']) && isset($territory['maximum_drive_time_seconds']) && is_numeric($territory['maximum_drive_time_seconds']) && (int)$routeEvidence['duration_seconds'] <= (int)$territory['maximum_drive_time_seconds'],
            default => false,
        };
    }
}
