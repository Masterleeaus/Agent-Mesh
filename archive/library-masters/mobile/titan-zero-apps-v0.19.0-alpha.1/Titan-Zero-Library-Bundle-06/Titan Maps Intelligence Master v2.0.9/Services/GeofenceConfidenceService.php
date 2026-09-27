<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
final class GeofenceConfidenceService
{
    public function confidence(float $accuracyMetres,float $radiusOrScaleMetres,int $confirmedSamples,int $requiredSamples): float
    {
        $scale=max(10.0,$radiusOrScaleMetres); $accuracy=max(0.0,$accuracyMetres);
        $accuracyScore=max(0.0,min(1.0,1.0-($accuracy/($scale*2.0))));
        $sampleScore=max(0.0,min(1.0,$confirmedSamples/max(1,$requiredSamples)));
        return round(100.0*((0.7*$accuracyScore)+(0.3*$sampleScore)),1);
    }
    public function effectiveHysteresis(float $configuredMetres,float $accuracyMetres): float
    {
        return max(0.0,$configuredMetres)+max(0.0,$accuracyMetres)*0.35;
    }
}
