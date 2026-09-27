<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlan;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlanRun;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlanStop;
use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;
use App\Extensions\TitanMapsIntelligence\Services\EncodedPolylineDecoder;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\RoutePlanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class RoutePlanController
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly RoutePlanService $plans,
        private readonly MapsConfiguration $configuration,
        private readonly EncodedPolylineDecoder $decoder,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->planRules());
        try {
            $plan = $this->plans->create($data);
        } catch (MapsIntelligenceException $exception) {
            return response()->json(['error'=>$exception->toSafeArray()],422);
        }
        return response()->json(['data'=>$this->present($plan->fresh(['stops','runs','currentRun']) ?? $plan)],201);
    }

    public function show(RoutePlan $mapsRoutePlan): JsonResponse
    {
        return response()->json(['data'=>$this->present($mapsRoutePlan->load(['stops','runs','currentRun']))]);
    }

    public function history(Request $request): JsonResponse
    {
        $limit=min(max((int)$request->integer('limit',20),1),$this->configuration->routePlanHistoryLimit());
        $rows=RoutePlan::query()->forCompany($this->context->companyId())->with(['stops','currentRun'])->latest('updated_at')->limit($limit)->get();
        return response()->json(['data'=>$rows->map(fn(RoutePlan $plan): array=>$this->present($plan))->values()->all()]);
    }

    public function optimise(Request $request, RoutePlan $mapsRoutePlan): JsonResponse
    {
        $data=$request->validate(['render_geometry'=>['nullable','boolean']]);
        try {
            $this->plans->optimise($mapsRoutePlan,'manual',(bool)($data['render_geometry']??false));
        } catch (MapsIntelligenceException $exception) {
            return response()->json(['error'=>$exception->toSafeArray()],422);
        }
        return response()->json(['data'=>$this->present($mapsRoutePlan->fresh(['stops','runs','currentRun']) ?? $mapsRoutePlan)]);
    }

    public function emergency(Request $request, RoutePlan $mapsRoutePlan): JsonResponse
    {
        $data=$request->validate($this->singleStopRules(true));
        try {
            $this->plans->insertEmergencyStop($mapsRoutePlan,$data,(bool)($data['render_geometry']??false));
        } catch (MapsIntelligenceException $exception) {
            return response()->json(['error'=>$exception->toSafeArray()],422);
        }
        return response()->json(['data'=>$this->present($mapsRoutePlan->fresh(['stops','runs','currentRun']) ?? $mapsRoutePlan)],201);
    }

    public function updateStopStatus(Request $request, RoutePlan $mapsRoutePlan, string $stopId): JsonResponse
    {
        $data=$request->validate(['status'=>['required','in:planned,completed,cancelled'],'render_geometry'=>['nullable','boolean']]);
        $stop=RoutePlanStop::query()->forCompany($this->context->companyId())->where('route_plan_id',$mapsRoutePlan->id)->whereKey($stopId)->firstOrFail();
        try {
            $this->plans->setStopStatus($mapsRoutePlan,$stop,(string)$data['status'],(bool)($data['render_geometry']??false));
        } catch (MapsIntelligenceException $exception) {
            return response()->json(['error'=>$exception->toSafeArray()],422);
        }
        return response()->json(['data'=>$this->present($mapsRoutePlan->fresh(['stops','runs','currentRun']) ?? $mapsRoutePlan)]);
    }

    /** @return array<string,array<int|string,mixed>> */
    private function planRules(): array
    {
        $max=$this->configuration->routePlanMaximumStops();
        return [
            'name'=>['required','string','max:191'],'service_date'=>['nullable','date'],'worker_public_id'=>['nullable','string','max:191'],
            'travel_mode'=>['nullable','in:DRIVE,WALK,BICYCLE,TWO_WHEELER,TRANSIT'],
            'routing_preference'=>['nullable','in:TRAFFIC_UNAWARE,TRAFFIC_AWARE,TRAFFIC_AWARE_OPTIMAL'],'start_at'=>['nullable','date'],
            'render_geometry'=>['nullable','boolean'],'stops'=>['required','array','min:2','max:'.$max],
            'stops.*.stop_type'=>['required','in:depot,job,supplier,contractor,break,custom'],'stops.*.label'=>['required','string','max:191'],
            'stops.*.reference_type'=>['nullable','in:job,property,branch,supplier,contractor'],'stops.*.public_reference_id'=>['nullable','string','max:191'],
            'stops.*.latitude'=>['nullable','numeric','between:-90,90'],'stops.*.longitude'=>['nullable','numeric','between:-180,180'],
            'stops.*.service_duration_seconds'=>['nullable','integer','min:0','max:86400'],'stops.*.window_start'=>['nullable','date'],
            'stops.*.window_end'=>['nullable','date'],'stops.*.locked'=>['nullable','boolean'],
        ];
    }

    /** @return array<string,array<int|string,mixed>> */
    private function singleStopRules(bool $emergency=false): array
    {
        return [
            'stop_type'=>['nullable','in:depot,job,supplier,contractor,break,custom'],'label'=>['required','string','max:191'],
            'reference_type'=>['nullable','in:job,property,branch,supplier,contractor'],'public_reference_id'=>['nullable','string','max:191'],
            'latitude'=>['nullable','numeric','between:-90,90'],'longitude'=>['nullable','numeric','between:-180,180'],
            'service_duration_seconds'=>['nullable','integer','min:0','max:86400'],'window_start'=>['nullable','date'],
            'window_end'=>['nullable','date'],'locked'=>['nullable','boolean'],'render_geometry'=>['nullable','boolean'],
        ];
    }

    /** @return array<string,mixed> */
    private function present(RoutePlan $plan): array
    {
        $plan->loadMissing(['stops','currentRun']);
        $run=$plan->currentRun;
        $stops=$plan->stops->sortBy('sequence')->values();
        $scheduleById=[];
        foreach ((array)($run?->schedule ?? []) as $row) if(isset($row['stop_id'])) $scheduleById[(string)$row['stop_id']]=$row;
        $markers=$stops->map(function(RoutePlanStop $stop,int $index) use($scheduleById,$plan): array {
            $schedule=$scheduleById[(string)$stop->id]??[];
            return [
                'id'=>(string)$stop->id,'sequence'=>(int)$stop->sequence,'original_sequence'=>(int)$stop->original_sequence,
                'stop_type'=>(string)$stop->stop_type,'label'=>(string)$stop->label,'reference_type'=>$stop->reference_type,
                'public_reference_id'=>$stop->public_reference_id,'lat'=>(float)$stop->latitude,'lng'=>(float)$stop->longitude,
                'service_duration_seconds'=>(int)$stop->service_duration_seconds,'window_start'=>$stop->window_start?->toAtomString(),
                'window_end'=>$stop->window_end?->toAtomString(),'locked'=>(bool)$stop->locked,'status'=>(string)$stop->status,
                'emergency'=>(bool)(($stop->metadata['emergency']??false)),'arrival_at'=>$schedule['arrival_at']??null,'departure_at'=>$schedule['departure_at']??null,
                'window_status'=>$schedule['window_status']??null,
                'status_url'=>route('dashboard.user.titan-maps-intelligence.travel.planner.stop-status',['mapsRoutePlan'=>$plan->id,'stopId'=>$stop->id]),
            ];
        })->all();
        $polylines=[];
        if($run!==null && is_array($run->route_snapshot_ids) && $run->route_snapshot_ids!==[]) {
            $routes=RouteSnapshot::query()->forCompany($this->context->companyId())->whereIn('id',$run->route_snapshot_ids)->get()->keyBy('id');
            foreach($run->route_snapshot_ids as $routeId){
                $route=$routes->get($routeId); if(!$route) continue;
                $points=$route->encoded_polyline ? $this->decoder->decode((string)$route->encoded_polyline) : [
                    ['lat'=>(float)$route->origin_latitude,'lng'=>(float)$route->origin_longitude],
                    ['lat'=>(float)$route->destination_latitude,'lng'=>(float)$route->destination_longitude],
                ];
                $polylines[]=['id'=>'plan-route-'.$routeId,'type'=>$route->result_basis==='provider_route'?'route':($route->result_basis==='last_valid_snapshot'?'route_stale':'route_estimate'),'points'=>$points];
            }
        }
        if($polylines===[] && count($markers)>1){
            $polylines[]=['id'=>'plan-sequence','type'=>'route_plan_sequence','points'=>array_map(fn(array $m):array=>['lat'=>$m['lat'],'lng'=>$m['lng']],array_values(array_filter($markers,fn(array $m):bool=>$m['status']!=='cancelled')))];
        }
        return [
            'id'=>(string)$plan->id,'name'=>(string)$plan->name,'service_date'=>$plan->service_date?->format('Y-m-d'),'worker_public_id'=>$plan->worker_public_id,
            'travel_mode'=>(string)$plan->travel_mode,'routing_preference'=>(string)$plan->routing_preference,'start_at'=>$plan->start_at?->toAtomString(),
            'status'=>(string)$plan->status,'stops'=>$markers,'map'=>['markers'=>$markers,'polylines'=>$polylines],
            'actions'=>[
                'optimise'=>route('dashboard.user.titan-maps-intelligence.travel.planner.optimise',['mapsRoutePlan'=>$plan->id]),
                'emergency'=>route('dashboard.user.titan-maps-intelligence.travel.planner.emergency',['mapsRoutePlan'=>$plan->id]),
                'show'=>route('dashboard.user.titan-maps-intelligence.travel.planner.show',['mapsRoutePlan'=>$plan->id]),
            ],
            'run'=>$run===null?null:[
                'id'=>(string)$run->id,'revision'=>(int)$run->revision,'trigger'=>(string)$run->trigger,'basis'=>(string)$run->result_basis,'provider'=>$run->provider,
                'algorithm'=>(string)$run->algorithm,'baseline_distance_metres'=>$run->baseline_distance_metres,'optimised_distance_metres'=>$run->optimised_distance_metres,
                'distance_savings_metres'=>$run->distance_savings_metres,'baseline_duration_seconds'=>$run->baseline_duration_seconds,
                'optimised_duration_seconds'=>$run->optimised_duration_seconds,'duration_savings_seconds'=>$run->duration_savings_seconds,
                'window_violations'=>$run->window_violations??[],'geometry_status'=>(string)$run->geometry_status,'calculated_at'=>$run->calculated_at?->toAtomString(),
            ],
        ];
    }
}
