<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
final class RouteFreshnessPolicy
{
    public function validForSeconds(string $trafficBasis): int
    {
        return match(strtolower($trafficBasis)){
            'live','traffic_aware'=>900,
            'typical'=>7200,
            'static','traffic_unaware'=>86400,
            default=>0,
        };
    }
    public function mustRefresh(int $calculatedAtTimestamp,?int $validUntilTimestamp=null,int $maximumRecommendationAgeSeconds=7200): bool
    {
        $now=time();
        if($validUntilTimestamp!==null && $validUntilTimestamp<=$now) return true;
        return ($now-$calculatedAtTimestamp)>$maximumRecommendationAgeSeconds;
    }
}
