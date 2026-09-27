<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Http\Requests\AnalyseTerritoryRequest;
use App\Extensions\TitanMapsIntelligence\Http\Resources\TerritoryAnalysisResource;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysis;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalysisManager;

final class TerritoryController
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer, private readonly TerritoryAnalysisManager $manager) {}

    public function analyse(AnalyseTerritoryRequest $request): TerritoryAnalysisResource
    {
        $data = $request->validated();
        return new TerritoryAnalysisResource($this->manager->analyse($data['search_id'], $data['analysis_type'] ?? 'provider_coverage', $data['search_area'] ?? []));
    }

    public function show(TerritoryAnalysis $mapsAnalysis): TerritoryAnalysisResource
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.territory.analyse', ['analysis_id' => $mapsAnalysis->getKey()]);
        return new TerritoryAnalysisResource($mapsAnalysis);
    }
}
