<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Models\ServiceTerritory;
use App\Extensions\TitanMapsIntelligence\Services\ServiceTerritoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class ServiceTerritoryController
{
    public function __construct(private readonly ServiceTerritoryService $territories, private readonly AuthorisedCompanyContext $context) {}
    public function index(): JsonResponse { return response()->json(['data'=>ServiceTerritory::query()->forCompany($this->context->companyId())->orderByDesc('priority')->get()]); }
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $data=$this->validatedDefinition($request); $territory=$this->territories->create($data);
        if($request->expectsJson()) return response()->json(['data'=>$territory],201);
        return redirect()->route($this->returnRoute((string)$territory->match_mode))->with('status','Service territory created.');
    }
    public function update(Request $request, ServiceTerritory $mapsServiceTerritory): JsonResponse
    { return response()->json(['data'=>$this->territories->update($mapsServiceTerritory,$this->validatedDefinition($request))]); }
    public function archive(ServiceTerritory $mapsServiceTerritory): JsonResponse
    { return response()->json(['data'=>$this->territories->archive($mapsServiceTerritory)]); }
    private function validatedDefinition(Request $request): array
    {
        $data=$request->validate([
            'name'=>['required','string','max:191'],'description'=>['nullable','string','max:4000'],'effect'=>['required','in:include,exclude'],'match_mode'=>['required','in:circle,polygon,postcode,suburb,road_distance,drive_time'],'priority'=>['nullable','integer','between:-32768,32767'],'status'=>['nullable','in:active,paused,archived'],'branch_public_id'=>['nullable','string','max:191'],
            'service_keys'=>['nullable'],'center_latitude'=>['nullable','numeric','between:-90,90'],'center_longitude'=>['nullable','numeric','between:-180,180'],'radius_metres'=>['nullable','numeric','min:1'],'geometry'=>['nullable'],'locality_values'=>['nullable'],'maximum_road_distance_metres'=>['nullable','integer','min:1'],'maximum_drive_time_seconds'=>['nullable','integer','min:1'],
            'maximum_drive_time_minutes'=>['nullable','numeric','min:0.01'],'maximum_road_distance_km'=>['nullable','numeric','min:0.001'],'pricing_hint_type'=>['nullable','in:fixed,percent'],'pricing_hint_value'=>['nullable','numeric','min:0'],'pricing_hint_currency'=>['nullable','string','max:8'],'effective_from'=>['nullable','date'],'effective_until'=>['nullable','date'],
        ]);
        foreach(['service_keys','locality_values'] as $key) if(is_string($data[$key]??null)) $data[$key]=array_values(array_filter(array_map('trim',preg_split('/[,\n]+/',(string)$data[$key])?:[])));
        if(is_string($data['geometry']??null) && trim((string)$data['geometry'])!=='') { $decoded=json_decode((string)$data['geometry'],true); $data['geometry']=is_array($decoded)?$decoded:[]; }
        if(isset($data['maximum_drive_time_minutes'])) $data['maximum_drive_time_seconds']=(int)round(((float)$data['maximum_drive_time_minutes'])*60);
        if(isset($data['maximum_road_distance_km'])) $data['maximum_road_distance_metres']=(int)round(((float)$data['maximum_road_distance_km'])*1000);
        unset($data['maximum_drive_time_minutes'],$data['maximum_road_distance_km']);
        if(!empty($data['pricing_hint_type']) && isset($data['pricing_hint_value'])) $data['pricing_hint']=['type'=>$data['pricing_hint_type'],'value'=>(float)$data['pricing_hint_value'],'currency'=>$data['pricing_hint_currency']??null];
        unset($data['pricing_hint_type'],$data['pricing_hint_value'],$data['pricing_hint_currency']);
        return $data;
    }
    private function returnRoute(string $mode): string { return in_array($mode,['road_distance','drive_time'],true)?'dashboard.user.titan-maps-intelligence.territories.travel-zones':'dashboard.user.titan-maps-intelligence.territories.service-areas'; }
}
