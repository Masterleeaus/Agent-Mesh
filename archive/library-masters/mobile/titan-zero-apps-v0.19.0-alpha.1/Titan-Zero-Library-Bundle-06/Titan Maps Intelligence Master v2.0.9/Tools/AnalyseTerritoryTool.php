<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalysisManager;

final class AnalyseTerritoryTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer, private readonly TerritoryAnalysisManager $manager) {}
    public function execute(array $input): array
    {
        $this->authorizer->authorize($this->context->userId(), $this->context->companyId(), 'titan-maps-intelligence.territory.analyse');
        $analysis = $this->manager->analyse((string) ($input['search_id'] ?? ''), (string) ($input['analysis_type'] ?? 'provider_coverage'), (array) ($input['search_area'] ?? []), ['agent_id' => $input['agent_id'] ?? null, 'conversation_id' => $input['conversation_id'] ?? null]);
        return ['ok' => true, 'data' => $analysis->only(['id','discovery_search_id','analysis_type','result_summary','generated_metrics','source_coverage','confidence','generated_at'])];
    }
}
