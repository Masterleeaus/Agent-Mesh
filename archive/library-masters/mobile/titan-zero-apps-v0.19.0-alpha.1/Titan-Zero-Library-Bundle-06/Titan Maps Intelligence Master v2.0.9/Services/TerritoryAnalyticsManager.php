<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\Events\TerritoryAnalysisCompleted;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysis;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysisCell;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\DB;

final class TerritoryAnalyticsManager
{
    public const TYPES=['provider_coverage','competitor_density','supplier_coverage','service_gap','branch_coverage','expansion_opportunity'];

    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly TerritoryGridBuilder $grid,
        private readonly TerritoryAnalysisService $analysis,
        private readonly TravelMatrixService $matrices,
        private readonly GeoDistanceService $distance,
        private readonly MapsConfiguration $configuration,
        private readonly AuditRecorder $audit,
        private readonly Dispatcher $events,
    ) {}

    public function run(string $analysisType,string $searchId,array $searchArea=[],array $execution=[]): TerritoryAnalysis
    {
        $companyId=$this->context->companyId();$userId=$this->context->userId();
        $this->authorizer->authorize($userId,$companyId,'titan-maps-intelligence.territory.analyse',['search_id'=>$searchId,'analysis_type'=>$analysisType]);
        return $this->runTrusted($analysisType,$searchId,$searchArea,$execution);
    }

    /**
     * Executes an analytics run after the enqueue boundary has already authorised the caller.
     * Queue jobs reconstruct a fixed tenant/user context and call this method; it must never be
     * exposed directly through a route or AI tool.
     */
    public function runTrusted(string $analysisType,string $searchId,array $searchArea=[],array $execution=[]): TerritoryAnalysis
    {
        if(!in_array($analysisType,self::TYPES,true)) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_ANALYSIS_TYPE_INVALID','Unsupported territory analytics methodology.');
        $companyId=$this->context->companyId();$userId=$this->context->userId();
        $search=DiscoverySearch::query()->forCompany($companyId)->whereKey($searchId)->firstOrFail();
        $bounds=$this->resolveBounds($search,$searchArea);
        $cells=$this->grid->build($bounds,$this->configuration->territoryAnalyticsCellSizeKm(),$this->configuration->territoryAnalyticsMaximumCells());
        $source=$this->decorateEvidence($companyId,$searchId,$cells,$analysisType);
        $cells=$source['cells'];
        $context=[
            'target_provider_count'=>$this->configuration->territoryAnalyticsTargetProviderCount(),
            'competitor_density_ceiling'=>$this->configuration->territoryAnalyticsCompetitorDensityCeiling(),
            'branch_distance_ceiling_km'=>$this->configuration->territoryAnalyticsBranchDistanceCeilingKm(),
            'weights'=>$this->configuration->territoryAnalyticsExpansionWeights(),
        ];
        $result=$this->analysis->analyseByType($analysisType,$cells,$context);
        $area=array_sum(array_map(fn($c)=>(float)($c['area_square_km']??0),$cells));

        $record=DB::transaction(function()use($companyId,$searchId,$search,$bounds,$analysisType,$result,$area,$source,$userId): TerritoryAnalysis {
            $record=TerritoryAnalysis::query()->create([
                'company_id'=>$companyId,'branch_id'=>$this->context->branchId(),'workspace_id'=>$this->context->workspaceId(),'discovery_search_id'=>$searchId,
                'search_area'=>$bounds,'categories'=>(array)($search->categories??[]),'analysis_type'=>$analysisType,'methodology_key'=>$result['methodology_key'],'methodology_version'=>$result['methodology_version'],
                'observation_period'=>['search_created_at'=>$search->created_at?->toAtomString(),'analysis_generated_at'=>now()->toAtomString()],'area_square_km'=>$area,
                'input_summary'=>$source['input_summary'],'result_summary'=>$this->headline($analysisType,(array)$result['metrics']),'generated_metrics'=>$result['metrics'],'findings'=>$result['findings']??[],
                'source_coverage'=>$source['source_coverage'],'confidence'=>(float)($result['confidence']??0.0),'generated_at'=>now(),
            ]);
            $resultCells=[];foreach((array)($result['cells']??[]) as $r)$resultCells[(string)($r['cell_key']??'')]=$r;
            foreach($source['cells'] as $cell){$r=$resultCells[(string)$cell['cell_key']]??['score'=>null,'metrics'=>[]];$confidence=(float)($r['metrics']['evidence_completeness']??($analysisType==='supplier_coverage'?(($r['metrics']['travel_time_status']??'')==='available'?1.0:0.0):($result['confidence']??0.0)));
                TerritoryAnalysisCell::query()->create(['company_id'=>$companyId,'territory_analysis_id'=>(string)$record->id,'cell_key'=>$cell['cell_key'],'center_latitude'=>$cell['center_latitude'],'center_longitude'=>$cell['center_longitude'],'north_boundary'=>$cell['north'],'south_boundary'=>$cell['south'],'east_boundary'=>$cell['east'],'west_boundary'=>$cell['west'],'area_square_km'=>$cell['area_square_km'],'score'=>$r['score']??null,'confidence'=>$confidence,'metrics'=>array_merge($this->rawEvidenceMetrics($cell),(array)($r['metrics']??[]))]);
            }
            return $record->load('cells');
        });
        $payload=['analysis_id'=>(string)$record->id,'search_id'=>$searchId,'analysis_type'=>$analysisType,'methodology_key'=>$record->methodology_key,'methodology_version'=>$record->methodology_version,'cell_count'=>$record->cells->count()];
        $this->audit->record(['type'=>'territory.analytics_completed','company_id'=>$companyId,'user_id'=>$userId,'agent_id'=>$execution['agent_id']??null,'entity_type'=>'territory_analysis','entity_id'=>(string)$record->id,'after'=>$payload]);
        $this->events->dispatch(new TerritoryAnalysisCompleted($companyId,$userId,$execution['agent_id']??null,$execution['conversation_id']??null,$execution['correlation_id']??null,null,$payload));
        return $record;
    }

    private function resolveBounds(DiscoverySearch $search,array $area): array
    {
        if($this->validBounds($area)) return ['north'=>(float)$area['north'],'south'=>(float)$area['south'],'east'=>(float)$area['east'],'west'=>(float)$area['west']];
        $stored=['north'=>$search->north_boundary,'south'=>$search->south_boundary,'east'=>$search->east_boundary,'west'=>$search->west_boundary];if($this->validBounds($stored))return array_map('floatval',$stored);
        if($search->latitude!==null&&$search->longitude!==null&&$search->radius_metres!==null){$lat=(float)$search->latitude;$lng=(float)$search->longitude;$radius=max(100.0,(float)$search->radius_metres);$latDelta=$radius/111320.0;$lngDelta=$radius/(111320.0*max(0.01,cos(deg2rad($lat))));return ['north'=>$lat+$latDelta,'south'=>$lat-$latDelta,'east'=>$lng+$lngDelta,'west'=>$lng-$lngDelta];}
        $points=DiscoveryCandidate::query()->forCompany($this->context->companyId())->with('place')->where('discovery_search_id',(string)$search->id)->get()->map(fn($c)=>$c->place)->filter(fn($p)=>$p&&$p->latitude!==null&&$p->longitude!==null);
        if($points->isEmpty()) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_ANALYTICS_AREA_INVALID','The discovery search has no usable geographic bounds or observed coordinates.');
        $lats=$points->pluck('latitude')->map(fn($v)=>(float)$v);$lngs=$points->pluck('longitude')->map(fn($v)=>(float)$v);$pad=0.01;return ['north'=>$lats->max()+$pad,'south'=>$lats->min()-$pad,'east'=>$lngs->max()+$pad,'west'=>$lngs->min()-$pad];
    }
    private function validBounds(array $b): bool { return isset($b['north'],$b['south'],$b['east'],$b['west'])&&is_numeric($b['north'])&&is_numeric($b['south'])&&is_numeric($b['east'])&&is_numeric($b['west'])&&(float)$b['north']>(float)$b['south']&&(float)$b['east']>(float)$b['west']; }

    private function decorateEvidence(string $companyId,string $searchId,array $cells,string $analysisType): array
    {
        foreach($cells as &$cell){$cell+=['provider_count'=>0,'internal_count'=>0,'competitor_count'=>0,'supplier_count'=>0,'supplier_eta_seconds'=>null,'supplier_distance_metres'=>null,'supplier_travel_basis'=>'unavailable','job_count'=>null,'branch_public_id'=>null,'branch_distance_km'=>null,'branch_distance_basis'=>'unavailable'];}unset($cell);
        $candidates=DiscoveryCandidate::query()->forCompany($companyId)->with('place')->where('discovery_search_id',$searchId)->get();$typeCounts=[];$suppliers=[];
        foreach($candidates as $candidate){$type=(string)$candidate->candidate_type;$typeCounts[$type]=($typeCounts[$type]??0)+1;$place=$candidate->place;if(!$place||$place->latitude===null||$place->longitude===null)continue;$idx=$this->grid->locate($cells,(float)$place->latitude,(float)$place->longitude);if($idx===null)continue;
            if(in_array($type,['provider_candidate','contractor_candidate','emergency_provider'],true))$cells[$idx]['provider_count']++;
            if($type==='competitor')$cells[$idx]['competitor_count']++;
            if($type==='supplier_candidate'){$cells[$idx]['supplier_count']++;$suppliers[]=['lat'=>(float)$place->latitude,'lng'=>(float)$place->longitude,'id'=>(string)$candidate->id,'label'=>(string)($place->name??'Supplier')];}
        }
        $internal=MapLocation::query()->forCompany($companyId)->where('reference_type','contractor')->whereNotNull('latitude')->whereNotNull('longitude')->get();foreach($internal as $loc){$idx=$this->grid->locate($cells,(float)$loc->latitude,(float)$loc->longitude);if($idx!==null)$cells[$idx]['internal_count']++;}
        $jobs=MapLocation::query()->forCompany($companyId)->where('reference_type','job')->whereNotNull('latitude')->whereNotNull('longitude')->get()->filter(fn($l)=>$this->grid->locate($cells,(float)$l->latitude,(float)$l->longitude)!==null)->values();
        if($jobs->isNotEmpty()){foreach($cells as &$cell)$cell['job_count']=0;unset($cell);foreach($jobs as $loc){$idx=$this->grid->locate($cells,(float)$loc->latitude,(float)$loc->longitude);if($idx!==null)$cells[$idx]['job_count']++;}}
        $branches=MapLocation::query()->forCompany($companyId)->where('reference_type','branch')->whereNotNull('latitude')->whereNotNull('longitude')->get();$this->decorateBranchEvidence($cells,$branches);
        $matrixBasis=null;if(in_array($analysisType,['supplier_coverage','expansion_opportunity'],true)&&$suppliers!==[]){$matrixBasis=$this->decorateSupplierTravel($cells,array_slice($suppliers,0,$this->configuration->territoryAnalyticsSupplierPool()));}
        ksort($typeCounts);
        return ['cells'=>$cells,'input_summary'=>['cell_count'=>count($cells),'candidate_count'=>$candidates->count(),'candidate_types'=>$typeCounts,'internal_contractor_locations'=>$internal->count(),'job_locations'=>$jobs->count(),'job_demand_status'=>$jobs->isEmpty()?'unavailable':'observed','branch_locations'=>$branches->count(),'supplier_points'=>count($suppliers),'supplier_matrix_basis'=>$matrixBasis],'source_coverage'=>['discovery_candidates'=>$candidates->count(),'canonical_internal_locations'=>$internal->count(),'canonical_job_locations'=>$jobs->count(),'canonical_branch_locations'=>$branches->count(),'supplier_matrix_basis'=>$matrixBasis]];
    }

    private function decorateSupplierTravel(array &$cells,array $suppliers): ?string
    {
        $origins=array_map(fn($c)=>new Coordinates((float)$c['center_latitude'],(float)$c['center_longitude']),$cells);$destinations=array_map(fn($s)=>new Coordinates((float)$s['lat'],(float)$s['lng']),$suppliers);
        $originRefs=array_map(fn($c)=>['reference_type'=>'territory_cell','public_reference_id'=>$c['cell_key'],'label'=>$c['cell_key']],$cells);$destRefs=array_map(fn($s)=>['reference_type'=>'supplier_candidate','public_reference_id'=>$s['id'],'label'=>$s['label']],$suppliers);
        $calc=$this->matrices->calculate(new RouteMatrixRequest($origins,$destinations,'DRIVE','TRAFFIC_AWARE'),$originRefs,$destRefs);$snapshot=$calc['snapshot'];$best=[];
        foreach($snapshot->elements as $el){$oi=(int)$el->origin_index;$duration=$el->duration_seconds!==null?(int)$el->duration_seconds:null;if($duration===null)continue;if(!isset($best[$oi])||$duration<$best[$oi]['duration'])$best[$oi]=['duration'=>$duration,'distance'=>$el->distance_metres!==null?(int)$el->distance_metres:null];}
        foreach($cells as $i=>&$cell)if(isset($best[$i])){$cell['supplier_eta_seconds']=$best[$i]['duration'];$cell['supplier_distance_metres']=$best[$i]['distance'];$cell['supplier_travel_basis']=(string)$snapshot->result_basis;}unset($cell);
        return (string)$snapshot->result_basis;
    }

    private function decorateBranchEvidence(array &$cells,$branches): void
    {
        if($branches->isEmpty())return;foreach($cells as &$cell){$best=null;foreach($branches as $branch){$km=$this->distance->kilometres((float)$cell['center_latitude'],(float)$cell['center_longitude'],(float)$branch->latitude,(float)$branch->longitude);if($best===null||$km<$best['km'])$best=['km'=>$km,'id'=>(string)$branch->public_reference_id];}if($best){$cell['branch_public_id']=$best['id'];$cell['branch_distance_km']=$best['km'];$cell['branch_distance_basis']='straight_line';}}unset($cell);
    }
    private function rawEvidenceMetrics(array $cell): array { return array_intersect_key($cell,array_flip(['provider_count','internal_count','competitor_count','supplier_count','supplier_eta_seconds','supplier_distance_metres','supplier_travel_basis','job_count','branch_public_id','branch_distance_km','branch_distance_basis'])); }
    private function headline(string $type,array $metrics): array { return ['analysis_type'=>$type,'headline_metrics'=>$metrics]; }
}
