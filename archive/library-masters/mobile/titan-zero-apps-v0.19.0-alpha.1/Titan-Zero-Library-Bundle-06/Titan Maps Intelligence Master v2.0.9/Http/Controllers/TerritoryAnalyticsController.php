<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Http\Resources\TerritoryAnalysisResource;
use App\Extensions\TitanMapsIntelligence\Jobs\RunTerritoryAnalyticsJob;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysis;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalyticsManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class TerritoryAnalyticsController
{
    public function __construct(private readonly TerritoryAnalyticsManager $analytics, private readonly AuthorisedCompanyContext $context, private readonly MapsConfiguration $configuration) {}

    public function run(Request $request): RedirectResponse|JsonResponse
    {
        $data=$request->validate([
            'search_id'=>['required','string','max:64'],
            'analysis_type'=>['required','string','in:provider_coverage,competitor_density,supplier_coverage,service_gap,branch_coverage,expansion_opportunity'],
            'north'=>['nullable','numeric','between:-90,90'],'south'=>['nullable','numeric','between:-90,90'],'east'=>['nullable','numeric','between:-180,180'],'west'=>['nullable','numeric','between:-180,180'],
        ]);
        $area=[];foreach(['north','south','east','west'] as $k)if(isset($data[$k]))$area[$k]=(float)$data[$k];
        $snapshot_ttl=$this->configuration->territoryAnalyticsSnapshotTtlSeconds();
        $fresh=TerritoryAnalysis::query()->forCompany($this->context->companyId())
            ->with('cells')->where('discovery_search_id',(string)$data['search_id'])
            ->where('analysis_type',(string)$data['analysis_type'])
            ->where('generated_at','>=',now()->subSeconds($snapshot_ttl))->latest('generated_at')->first();
        if($fresh){
            if($request->expectsJson()) return response()->json(['status'=>'cached','cached'=>true,'territory_analytics_version'=>$this->configuration->territoryAnalyticsVersion(),'data'=>(new TerritoryAnalysisResource($fresh))->resolve($request)]);
            return redirect()->route($this->routeFor((string)$data['analysis_type']))->with('status','Fresh territory analytics snapshot reused.')->with('territory_analysis_id',(string)$fresh->id);
        }
        RunTerritoryAnalyticsJob::dispatch(
            $this->context->companyId(),$this->context->userId(),$this->context->branchId(),$this->context->workspaceId(),
            (string)$data['analysis_type'],(string)$data['search_id'],$area,
            ['correlation_id'=>$request->header('X-Correlation-ID'),'trace_id'=>$request->header('X-Trace-ID')]
        );
        if($request->expectsJson()) return response()->json(['status'=>'queued','cached'=>false,'territory_analytics_version'=>$this->configuration->territoryAnalyticsVersion()],202);
        return redirect()->route($this->routeFor((string)$data['analysis_type']))->with('status','Territory analytics queued.');
    }

    public function index(Request $request): JsonResponse
    {
        $limit=max(1,min($this->configuration->territoryAnalyticsHistoryLimit(),(int)$request->query('limit',30)));
        $type=(string)$request->query('analysis_type','');
        $query=TerritoryAnalysis::query()->forCompany($this->context->companyId())->with('cells')->latest('generated_at');
        if($type!=='')$query->where('analysis_type',$type);
        return response()->json(['data'=>$query->limit($limit)->get()->map(fn($a)=>(new TerritoryAnalysisResource($a))->resolve($request))->all()]);
    }

    public function show(Request $request,TerritoryAnalysis $mapsTerritoryAnalysis): JsonResponse
    { return response()->json(['data'=>(new TerritoryAnalysisResource($mapsTerritoryAnalysis->load('cells')))->resolve($request)]); }

    private function routeFor(string $type): string
    {
        return match($type){
            'provider_coverage'=>'dashboard.user.titan-maps-intelligence.territories.providers',
            'competitor_density'=>'dashboard.user.titan-maps-intelligence.territories.competitors',
            'supplier_coverage'=>'dashboard.user.titan-maps-intelligence.territories.suppliers',
            'service_gap'=>'dashboard.user.titan-maps-intelligence.territories.gaps',
            'branch_coverage'=>'dashboard.user.titan-maps-intelligence.territories.branch-coverage',
            'expansion_opportunity'=>'dashboard.user.titan-maps-intelligence.territories.expansion-opportunities',
            default=>'dashboard.user.titan-maps-intelligence.territories.analysis',
        };
    }
}
