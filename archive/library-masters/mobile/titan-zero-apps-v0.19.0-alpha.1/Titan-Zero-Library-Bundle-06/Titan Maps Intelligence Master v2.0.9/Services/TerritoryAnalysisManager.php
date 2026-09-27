<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysis;

final class TerritoryAnalysisManager
{
    public function __construct(private readonly TerritoryAnalyticsManager $analytics) {}
    public function analyse(string $searchId,string $analysisType='provider_coverage',array $searchArea=[],array $execution=[]): TerritoryAnalysis
    { return $this->analytics->run($analysisType,$searchId,$searchArea,$execution); }
}
