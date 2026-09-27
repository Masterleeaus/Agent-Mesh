<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\ProviderCoverageAnalyzer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\CompetitorDensityAnalyzer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\SupplierAccessAnalyzer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\ServiceGapAnalyzer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\BranchCoverageAnalyzer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\ExpansionOpportunityAnalyzer;

final class TerritoryAnalysisService
{
    public function __construct(
        private readonly ProviderCoverageAnalyzer $providerCoverage,
        private readonly CompetitorDensityAnalyzer $competitorDensity,
        private readonly SupplierAccessAnalyzer $supplierAccess,
        private readonly ServiceGapAnalyzer $serviceGap,
        private readonly BranchCoverageAnalyzer $branchCoverage,
        private readonly ExpansionOpportunityAnalyzer $expansionOpportunity,
    ) {}

    public function analyseByType(string $analysisType, array $cells, array $context = []): array
    {
        return match ($analysisType) {
            'provider_coverage' => $this->providerCoverage->analyse($cells, $context),
            'competitor_density' => $this->competitorDensity->analyse($cells, $context),
            'supplier_coverage' => $this->supplierAccess->analyse($cells, $context),
            'service_gap' => $this->serviceGap->analyse($cells, $context),
            'branch_coverage' => $this->branchCoverage->analyse($cells, $context),
            'expansion_opportunity' => $this->expansionOpportunity->analyse($cells, $context),
            default => throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_ANALYSIS_TYPE_INVALID', 'Unsupported territory analytics methodology.', ['analysis_type'=>$analysisType]),
        };
    }

    /** Legacy compatibility for callers that supply only observed places. */
    public function analyse(array $places): array
    {
        $cells = [[
            'cell_key'=>'legacy-observation-area',
            'area_square_km'=>1.0,
            'provider_count'=>count($places),
            'internal_count'=>0,
            'competitor_count'=>0,
            'supplier_eta_seconds'=>null,
            'job_count'=>null,
            'branch_public_id'=>null,
        ]];
        $result = $this->providerCoverage->analyse($cells, []);
        return [
            'total_places'=>count($places),
            'categories'=>$this->categories($places),
            'distance_bands'=>$this->distanceBands($places),
            'source_coverage'=>$this->sources($places),
            'average_confidence'=>$this->averageConfidence($places),
            'interpretation'=>null,
            'methodology_key'=>$result['methodology_key'],
            'methodology_version'=>$result['methodology_version'],
        ];
    }

    private function categories(array $places): array { $out=[];foreach($places as $p){$k=(string)($p['primary_category']??'unclassified');$out[$k]=($out[$k]??0)+1;}ksort($out);return $out; }
    private function sources(array $places): array { $out=[];foreach($places as $p){$k=(string)($p['provider']??'unknown');$out[$k]=($out[$k]??0)+1;}ksort($out);return $out; }
    private function distanceBands(array $places): array { $b=['0-5km'=>0,'5-15km'=>0,'15km+'=>0];foreach($places as $p){$d=max(0.0,(float)($p['distance_km']??0));if($d<=5)$b['0-5km']++;elseif($d<=15)$b['5-15km']++;else$b['15km+']++;}return $b; }
    private function averageConfidence(array $places): float { if(!$places)return 0.0;$sum=0.0;foreach($places as $p)$sum+=max(0.0,min(1.0,(float)($p['confidence']??0)));return $sum/count($places); }
}
