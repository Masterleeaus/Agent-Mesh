<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Jobs\RunTerritoryAnalyticsJob;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysis;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalyticsManager;

final class RunTerritoryAnalyticsTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly TerritoryAnalyticsManager $analytics,private readonly MapsConfiguration $configuration) {}
    public function execute(array $input): array
    {
        $this->authorizer->authorize($this->context->userId(),$this->context->companyId(),'titan-maps-intelligence.territory.analyse');
        $type=(string)($input['analysis_type']??'provider_coverage');$searchId=(string)($input['search_id']??'');
        $snapshot_ttl=$this->configuration->territoryAnalyticsSnapshotTtlSeconds();
        $fresh=TerritoryAnalysis::query()->forCompany($this->context->companyId())->with('cells')
            ->where('discovery_search_id',$searchId)->where('analysis_type',$type)
            ->where('generated_at','>=',now()->subSeconds($snapshot_ttl))->latest('generated_at')->first();
        if($fresh) return ['ok'=>true,'cached'=>true,'status'=>'cached','territory_analytics_version'=>$this->configuration->territoryAnalyticsVersion(),'data'=>['analysis_id'=>(string)$fresh->id,'analysis_type'=>$fresh->analysis_type,'methodology_key'=>$fresh->methodology_key,'methodology_version'=>$fresh->methodology_version,'area_square_km'=>$fresh->area_square_km,'metrics'=>$fresh->generated_metrics,'findings'=>$fresh->findings,'confidence'=>$fresh->confidence]];
        RunTerritoryAnalyticsJob::dispatch(
            $this->context->companyId(),$this->context->userId(),$this->context->branchId(),$this->context->workspaceId(),
            $type,$searchId,(array)($input['search_area']??[]),
            ['agent_id'=>$input['agent_id']??null,'conversation_id'=>$input['conversation_id']??null,'correlation_id'=>$input['correlation_id']??null,'trace_id'=>$input['trace_id']??null]
        );
        return ['ok'=>true,'cached'=>false,'status'=>'queued','territory_analytics_version'=>$this->configuration->territoryAnalyticsVersion(),'data'=>['analysis_type'=>$type,'search_id'=>$searchId]];
    }
}
