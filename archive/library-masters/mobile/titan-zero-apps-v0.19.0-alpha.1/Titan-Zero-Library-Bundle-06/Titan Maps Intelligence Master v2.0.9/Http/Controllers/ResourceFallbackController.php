<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\Http\Requests\DecideResourceFallbackRequest;
use App\Extensions\TitanMapsIntelligence\Http\Requests\PromoteResourceFallbackRequest;
use App\Extensions\TitanMapsIntelligence\Http\Requests\StartResourceFallbackRequest;
use App\Extensions\TitanMapsIntelligence\Models\ResourceFallbackRequest;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\ResourceFallbackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Contracts\View\View;

final class ResourceFallbackController
{
    public function __construct(private readonly AuthorisedCompanyContext $context,private readonly ResourceFallbackService $fallbacks,private readonly MapsConfiguration $configuration) {}

    public function index(Request $request): View
    {
        $companyId=$this->context->companyId();
        $history=ResourceFallbackRequest::query()->forCompany($companyId)->withCount('candidates')->latest('created_at')->limit($this->configuration->fallbackHistoryLimit())->get();
        $selected=null;$id=(string)$request->query('request_id','');if($id!=='')$selected=ResourceFallbackRequest::query()->forCompany($companyId)->with(['candidates.discoveryCandidate.place','decisions','discoverySearch'])->whereKey($id)->first();
        $map=['markers'=>[],'polylines'=>[],'polygons'=>[],'circles'=>[],'empty_message'=>'Start or select a fallback request to see sourcing candidates.'];
        if($selected){
            $target=['lat'=>(float)$selected->target_latitude,'lng'=>(float)$selected->target_longitude];
            $map['markers'][]=['id'=>'fallback-target','lat'=>$target['lat'],'lng'=>$target['lng'],'type'=>'job','label'=>'Fallback target','subtitle'=>$selected->job_public_id?'Job '.$selected->job_public_id:'Target location','meta'=>['resource_type'=>$selected->resource_type,'status'=>$selected->status]];
            foreach($selected->candidates as $candidate){if($candidate->latitude===null||$candidate->longitude===null)continue;$point=['lat'=>(float)$candidate->latitude,'lng'=>(float)$candidate->longitude];$map['markers'][]=['id'=>'fallback-candidate-'.$candidate->id,'lat'=>$point['lat'],'lng'=>$point['lng'],'type'=>'fallback_'.$candidate->source,'label'=>$candidate->label,'subtitle'=>$candidate->subtitle,'meta'=>['source'=>$candidate->source,'score'=>$candidate->fit_score,'status'=>$candidate->status,'eta_basis'=>$candidate->eta_basis,'duration_seconds'=>$candidate->duration_seconds,'road_distance_metres'=>$candidate->road_distance_metres]];$map['polylines'][]=['id'=>'fallback-line-'.$candidate->id,'type'=>'matrix_compare','points'=>[$target,$point]];}
        }
        return view('titan-maps-intelligence::user.resource-fallback',['history'=>$history,'selected'=>$selected,'mapPayload'=>$map,'mapUi'=>$this->configuration->mapUi(),'defaultRadius'=>$this->configuration->fallbackDefaultRadiusMetres()]);
    }

    public function history(Request $request): JsonResponse
    {
        $rows=ResourceFallbackRequest::query()->forCompany($this->context->companyId())->with(['candidates','decisions'])->latest('created_at')->limit(min(100,max(1,(int)$request->query('limit',30))))->get();
        return response()->json(['ok'=>true,'data'=>$rows]);
    }
    public function show(ResourceFallbackRequest $mapsResourceFallback): JsonResponse { return response()->json(['ok'=>true,'data'=>$mapsResourceFallback->load(['candidates.discoveryCandidate.place','decisions','discoverySearch'])]); }

    public function start(StartResourceFallbackRequest $request): RedirectResponse|JsonResponse
    {
        $data=$request->validated();$coords=isset($data['latitude'],$data['longitude'])?new Coordinates((float)$data['latitude'],(float)$data['longitude']):null;
        $record=$this->fallbacks->start((string)$data['resource_type'],$data['job_public_id']??null,$coords,$data['service_key']??null,$data['query']??null,$data);
        return $this->respond($request,$record,'Fallback sourcing started.');
    }
    public function refresh(Request $request,ResourceFallbackRequest $mapsResourceFallback): RedirectResponse|JsonResponse { return $this->respond($request,$this->fallbacks->refresh($mapsResourceFallback),'Fallback sourcing refreshed.'); }
    public function decide(DecideResourceFallbackRequest $request,ResourceFallbackRequest $mapsResourceFallback): RedirectResponse|JsonResponse
    {
        $d=$request->validated();$decision=$this->fallbacks->decide($mapsResourceFallback,(string)$d['candidate_id'],(string)$d['decision'],$d['reason']??null);$fresh=$mapsResourceFallback->fresh(['candidates.discoveryCandidate.place','decisions','discoverySearch'])??$mapsResourceFallback;
        if($request->expectsJson())return response()->json(['ok'=>true,'data'=>['decision'=>$decision,'request'=>$fresh]]);return redirect()->route('dashboard.user.titan-maps-intelligence.field.resource-fallback',['request_id'=>$mapsResourceFallback->id])->with('status','Fallback decision recorded.');
    }
    public function promote(PromoteResourceFallbackRequest $request,ResourceFallbackRequest $mapsResourceFallback): RedirectResponse|JsonResponse
    {
        $d=$request->validated();$result=$this->fallbacks->promote($mapsResourceFallback,(string)$d['candidate_id'],(array)$d['accepted_fields'],$d);
        if($request->expectsJson())return response()->json(['ok'=>true,'data'=>$result]);return redirect()->route('dashboard.user.titan-maps-intelligence.field.resource-fallback',['request_id'=>$mapsResourceFallback->id])->with('status','Approved discovery candidate promoted to CRM/operations.');
    }
    public function cancel(Request $request,ResourceFallbackRequest $mapsResourceFallback): RedirectResponse|JsonResponse
    {
        $record=$this->fallbacks->cancel($mapsResourceFallback,$request->string('reason')->toString()?:null);return $this->respond($request,$record,'Fallback request cancelled.');
    }
    private function respond(Request $request,ResourceFallbackRequest $record,string $message): RedirectResponse|JsonResponse
    {
        if($request->expectsJson())return response()->json(['ok'=>true,'data'=>$record->load(['candidates','decisions','discoverySearch'])]);
        return redirect()->route('dashboard.user.titan-maps-intelligence.field.resource-fallback',['request_id'=>$record->id])->with('status',$message);
    }
}
