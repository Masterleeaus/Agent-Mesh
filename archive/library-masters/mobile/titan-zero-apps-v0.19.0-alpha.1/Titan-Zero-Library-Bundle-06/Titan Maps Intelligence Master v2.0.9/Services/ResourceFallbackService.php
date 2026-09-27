<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\PlaceSearchRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\Enums\SearchStatus;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\ResourceFallbackCandidate;
use App\Extensions\TitanMapsIntelligence\Models\ResourceFallbackDecision;
use App\Extensions\TitanMapsIntelligence\Models\ResourceFallbackRequest;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Throwable;

final class ResourceFallbackService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly DispatchIntelligenceService $dispatch,
        private readonly NearestResourceService $nearest,
        private readonly DiscoverySearchService $searches,
        private readonly TravelMatrixService $matrices,
        private readonly CandidateReviewService $reviews,
        private readonly CandidatePromotionService $promotions,
        private readonly ResourceFallbackCandidateEnricher $enricher,
        private readonly ResourceFallbackStagePolicy $stages,
        private readonly MapsConfiguration $configuration,
        private readonly AuditRecorder $audit,
    ) {}

    /** @param array<string,mixed> $options */
    public function start(string $resourceType, ?string $jobPublicId, ?Coordinates $target, ?string $serviceKey, ?string $query, array $options=[]): ResourceFallbackRequest
    {
        $companyId=$this->context->companyId();$userId=$this->context->userId();
        $this->authorizer->authorize($userId,$companyId,'titan-maps-intelligence.resource-fallback.start');
        if(!in_array($resourceType,['contractor','supplier'],true))throw MapsIntelligenceException::fromCode('MAPS_FALLBACK_RESOURCE_TYPE_INVALID','Fallback resource type must be contractor or supplier.');
        $needType=(string)($options['operational_need_type']??($jobPublicId?'job':'manual'));
        $needPublicId=isset($options['operational_need_public_id'])?trim((string)$options['operational_need_public_id']):($needType==='job'?$jobPublicId:null);
        if(!in_array($needType,['manual','job','inventory_shortage'],true))throw MapsIntelligenceException::fromCode('MAPS_FALLBACK_NEED_TYPE_INVALID','Fallback operational need type is not supported.');
        if($needType==='inventory_shortage'&&$resourceType!=='supplier')throw MapsIntelligenceException::fromCode('MAPS_FALLBACK_NEED_TYPE_INVALID','Inventory shortage fallback is supported only for supplier sourcing.');
        if($needType==='inventory_shortage'&&($needPublicId===null||$needPublicId===''))throw MapsIntelligenceException::fromCode('MAPS_FALLBACK_NEED_REFERENCE_REQUIRED','Titan Gear inventory shortage fallback requires an operational need public ID.');
        $target=$this->resolveTarget($companyId,$jobPublicId,$target);
        $radius=(float)($options['radius_metres']??$this->configuration->fallbackDefaultRadiusMetres());
        $this->configuration->assertSearchLimits($this->configuration->fallbackDiscoveryResultLimit(),$radius);
        $request=ResourceFallbackRequest::query()->create([
            'company_id'=>$companyId,'branch_id'=>$this->context->branchId(),'workspace_id'=>$this->context->workspaceId(),'resource_type'=>$resourceType,
            'operational_need_type'=>$needType,'operational_need_public_id'=>$needPublicId,'job_public_id'=>$jobPublicId,'service_key'=>$serviceKey,'query'=>$query,'target_latitude'=>$target->latitude,'target_longitude'=>$target->longitude,
            'radius_metres'=>$radius,'travel_mode'=>(string)($options['travel_mode']??'DRIVE'),'routing_preference'=>(string)($options['routing_preference']??'TRAFFIC_AWARE'),'open_now'=>(bool)($options['open_now']??false),
            'status'=>'new','internal_check_status'=>$resourceType==='contractor'&&$jobPublicId?'pending':'not_applicable','approved_network_status'=>'pending',
            'requested_by_user_id'=>$userId,'metadata'=>['configuration_version'=>$this->configuration->version()],
        ]);
        $this->audit->record(['type'=>'resource_fallback.started','company_id'=>$companyId,'user_id'=>$userId,'entity_type'=>'resource_fallback_request','entity_id'=>(string)$request->id,'resource_type'=>$resourceType,'operational_need_type'=>$needType,'operational_need_public_id'=>$needPublicId,'job_public_id'=>$jobPublicId]);

        $internalAvailable=false;
        if($resourceType==='contractor' && $jobPublicId!==null && trim($jobPublicId)!==''){
            try{
                $rec=$this->dispatch->recommend($jobPublicId,1,(string)$request->travel_mode,(string)$request->routing_preference);
                $eligible=$rec->candidates->first(fn($c)=>(bool)$c->eligible && !(bool)$c->blocked);
                if($eligible){
                    $internalAvailable=true;
                    $request->forceFill(['internal_check_status'=>'available','internal_evidence'=>['dispatch_recommendation_id'=>(string)$rec->id,'worker_public_id'=>$eligible->worker_public_id,'score'=>(float)$eligible->total_score]])->save();
                    ResourceFallbackCandidate::query()->create([
                        'company_id'=>$companyId,'fallback_request_id'=>(string)$request->id,'source'=>'internal','resource_type'=>'contractor','source_reference_type'=>'worker','source_public_id'=>(string)$eligible->worker_public_id,
                        'label'=>'Internal worker '.(string)$eligible->worker_public_id,'latitude'=>$eligible->latitude,'longitude'=>$eligible->longitude,'road_distance_metres'=>$eligible->road_distance_metres,
                        'straight_line_distance_metres'=>$eligible->straight_line_distance_metres,'duration_seconds'=>$eligible->duration_seconds,'traffic_delay_seconds'=>$eligible->traffic_delay_seconds,
                        'eta_basis'=>$eligible->eta_basis,'matrix_condition'=>$eligible->matrix_condition,'fit_score'=>(float)$eligible->total_score,'rank'=>1,'status'=>'available',
                        'evidence'=>$eligible->evidence,'explanations'=>$eligible->explanations,'metadata'=>['dispatch_recommendation_id'=>(string)$rec->id],
                    ]);
                } else $request->forceFill(['internal_check_status'=>'exhausted','internal_evidence'=>['dispatch_recommendation_id'=>(string)$rec->id,'eligible_count'=>0]])->save();
            }catch(Throwable $e){
                $request->forceFill(['status'=>'failed','internal_check_status'=>'unavailable','internal_evidence'=>['error_code'=>'MAPS_INTERNAL_RESOURCE_CHECK_FAILED','exception_type'=>$e::class]])->save();
                throw MapsIntelligenceException::fromCode('MAPS_INTERNAL_RESOURCE_CHECK_FAILED','Titan could not prove that internal contractor capacity was exhausted. External discovery was not started.',[], $e);
            }
        }
        if($internalAvailable){$request->forceFill(['status'=>'internal_available','approved_network_status'=>'not_started','refreshed_at'=>now(),'review_due_at'=>now()->addSeconds($this->configuration->fallbackHumanReviewTimeoutSeconds())])->save();$this->audit->record(['type'=>'resource_fallback.internal_available','company_id'=>$companyId,'entity_type'=>'resource_fallback_request','entity_id'=>(string)$request->id,'operational_need_type'=>$needType,'operational_need_public_id'=>$needPublicId]);return $request->fresh(['candidates','decisions'])??$request;}

        $network=$this->nearest->find($target,$resourceType,$this->configuration->fallbackApprovedNetworkLimit(),(string)$request->travel_mode,(string)$request->routing_preference);
        $networkRows=array_values(array_filter((array)($network['resources']??[]),static fn(array $r):bool=>in_array((string)($r['source']??''),['canonical_location','approved_discovery_candidate'],true)));
        $stage=$this->stages->nextStage(false,count($networkRows));
        if($stage==='approved_network_review'){
            DB::transaction(function()use($request,$networkRows,$network,$companyId):void{
                foreach($networkRows as $rank=>$row)$this->persistCandidate($request,$this->enricher->approvedNetwork($row,$request),$rank+1);
                $request->forceFill(['status'=>'approved_network_review','approved_network_status'=>'found','approved_network_evidence'=>['count'=>count($networkRows),'basis'=>$network['basis']??'unknown','provider'=>$network['provider']??null,'freshness_status'=>$network['freshness_status']??null],'refreshed_at'=>now(),'review_due_at'=>now()->addSeconds($this->configuration->fallbackHumanReviewTimeoutSeconds())])->save();
            });
            $this->audit->record(['type'=>'resource_fallback.approved_network_review','company_id'=>$companyId,'entity_type'=>'resource_fallback_request','entity_id'=>(string)$request->id,'candidate_count'=>count($networkRows),'operational_need_type'=>$needType,'operational_need_public_id'=>$needPublicId]);
            return $request->fresh(['candidates','decisions'])??$request;
        }

        $request->forceFill(['approved_network_status'=>'exhausted','approved_network_evidence'=>['count'=>0,'basis'=>$network['basis']??'none']])->save();
        $search=$this->launchDiscovery($request,$target);
        $request->forceFill(['discovery_search_id'=>(string)$search->id,'status'=>'discovery_searching','refreshed_at'=>now(),'review_due_at'=>now()->addSeconds($this->configuration->fallbackHumanReviewTimeoutSeconds())])->save();
        $this->audit->record(['type'=>'resource_fallback.discovery_started','company_id'=>$companyId,'entity_type'=>'resource_fallback_request','entity_id'=>(string)$request->id,'discovery_search_id'=>(string)$search->id,'operational_need_type'=>$needType,'operational_need_public_id'=>$needPublicId]);
        return $request->fresh(['candidates','decisions','discoverySearch'])??$request;
    }

    public function refresh(ResourceFallbackRequest $request): ResourceFallbackRequest
    {
        $this->assertRequest($request,'titan-maps-intelligence.resource-fallback.read');
        if(!in_array((string)$request->status,['discovery_searching','discovery_review'],true)||!$request->discovery_search_id)return $request->load(['candidates','decisions','discoverySearch']);
        $search=DiscoverySearch::query()->forCompany($this->context->companyId())->whereKey((string)$request->discovery_search_id)->first();
        if(!$search)return $request;
        if($search->status===SearchStatus::Failed->value){$request->forceFill(['status'=>'failed','refreshed_at'=>now(),'review_due_at'=>now()->addSeconds($this->configuration->fallbackHumanReviewTimeoutSeconds())])->save();return $request->fresh(['candidates','decisions','discoverySearch'])??$request;}
        if(!in_array($search->status,[SearchStatus::Completed->value,SearchStatus::PartiallyCompleted->value],true)){$request->forceFill(['refreshed_at'=>now(),'review_due_at'=>now()->addSeconds($this->configuration->fallbackHumanReviewTimeoutSeconds())])->save();return $request->fresh(['candidates','decisions','discoverySearch'])??$request;}

        $types=$request->resource_type==='supplier'?['supplier_candidate']:['provider_candidate','contractor_candidate','emergency_provider'];
        $candidates=DiscoveryCandidate::query()->forCompany($this->context->companyId())->with('place')->where('discovery_search_id',(string)$search->id)->whereIn('candidate_type',$types)->limit($this->configuration->fallbackCandidateLimit())->get()->filter(fn($c)=>$c->place&&$c->place->latitude!==null&&$c->place->longitude!==null)->values();
        if($candidates->isEmpty()){$request->forceFill(['status'=>'discovery_review','refreshed_at'=>now(),'review_due_at'=>now()->addSeconds($this->configuration->fallbackHumanReviewTimeoutSeconds()),'metadata'=>array_merge((array)$request->metadata,['discovery_candidate_count'=>0])])->save();return $request->fresh(['candidates','decisions','discoverySearch'])??$request;}
        $origin=new Coordinates((float)$request->target_latitude,(float)$request->target_longitude);
        $destinations=$candidates->map(fn($c)=>new Coordinates((float)$c->place->latitude,(float)$c->place->longitude))->all();
        $refs=$candidates->map(fn($c)=>['reference_type'=>'discovery_candidate','public_reference_id'=>(string)$c->id,'label'=>(string)($c->place->name??'Candidate')])->all();
        $calc=$this->matrices->calculate(new RouteMatrixRequest([$origin],$destinations,(string)$request->travel_mode,(string)$request->routing_preference),[['reference_type'=>'fallback_request','public_reference_id'=>(string)$request->id,'label'=>'Fallback target']],$refs);
        $snapshot=$calc['snapshot'];$by=[];foreach($snapshot->elements as $element)$by[(int)$element->destination_index]=$element;
        $rows=[];foreach($candidates as $i=>$candidate)$rows[]=$this->enricher->discovery($candidate,$request,$by[$i]??null,(string)$snapshot->result_basis);
        usort($rows,static fn(array $a,array $b):int=>($b['fit_score']<=>$a['fit_score']) ?: (($a['duration_seconds']??PHP_INT_MAX)<=>($b['duration_seconds']??PHP_INT_MAX)));
        DB::transaction(function()use($request,$rows):void{foreach($rows as $rank=>$row)$this->persistCandidate($request,$row,$rank+1);$request->forceFill(['status'=>'discovery_review','refreshed_at'=>now(),'review_due_at'=>now()->addSeconds($this->configuration->fallbackHumanReviewTimeoutSeconds()),'metadata'=>array_merge((array)$request->metadata,['discovery_candidate_count'=>count($rows)])])->save();});
        $this->audit->record(['type'=>'resource_fallback.discovery_candidates_ready','company_id'=>$this->context->companyId(),'entity_type'=>'resource_fallback_request','entity_id'=>(string)$request->id,'discovery_search_id'=>(string)$search->id,'candidate_count'=>count($rows),'operational_need_type'=>$request->operational_need_type,'operational_need_public_id'=>$request->operational_need_public_id]);
        return $request->fresh(['candidates.discoveryCandidate.place','decisions','discoverySearch'])??$request;
    }

    public function decide(ResourceFallbackRequest $request,string $candidateId,string $decision,?string $reason=null): ResourceFallbackDecision
    {
        $this->assertRequest($request,'titan-maps-intelligence.resource-fallback.decide');
        if(!in_array($decision,['approve','reject'],true))throw MapsIntelligenceException::fromCode('MAPS_FALLBACK_DECISION_INVALID','Fallback decision must be approve or reject.');
        $candidate=ResourceFallbackCandidate::query()->forCompany($this->context->companyId())->where('fallback_request_id',$request->id)->whereKey($candidateId)->firstOrFail();
        if($candidate->source==='internal')throw MapsIntelligenceException::fromCode('MAPS_FALLBACK_DECISION_INVALID','Internal availability is not an external fallback candidate.');
        if($decision==='approve' && $candidate->source==='discovery' && $candidate->discovery_candidate_id){
            $disc=DiscoveryCandidate::query()->forCompany($this->context->companyId())->whereKey((string)$candidate->discovery_candidate_id)->firstOrFail();
            $targetType=$request->resource_type==='supplier'?'supplier_candidate':'contractor_candidate';
            if((string)$disc->candidate_type!==$targetType)$this->reviews->classify((string)$disc->id,$targetType,'Matched to an approved resource fallback request.',['basis'=>'fallback_resource_match']);
            if((string)$disc->review_status!=='approved')$this->reviews->approve((string)$disc->id,['basis'=>'fallback_human_approval']);
        }
        $now=CarbonImmutable::now('UTC');
        $record=DB::transaction(function()use($request,$candidate,$decision,$reason,$now):ResourceFallbackDecision{
            $candidate->forceFill($decision==='approve'?['status'=>'approved','reviewed_by_user_id'=>$this->context->userId(),'reviewed_at'=>$now,'approved_at'=>$now,'rejected_at'=>null]:['status'=>'rejected','reviewed_by_user_id'=>$this->context->userId(),'reviewed_at'=>$now,'rejected_at'=>$now])->save();
            if($decision==='approve')$request->forceFill($candidate->source==='approved_network'?['selected_candidate_id'=>(string)$candidate->id,'status'=>'closed','closed_at'=>$now,'metadata'=>array_merge((array)$request->metadata,['resolution'=>'approved_network'])]:['selected_candidate_id'=>(string)$candidate->id,'status'=>'approved'])->save();
            return ResourceFallbackDecision::query()->create(['company_id'=>$this->context->companyId(),'fallback_request_id'=>(string)$request->id,'fallback_candidate_id'=>(string)$candidate->id,'decision'=>$decision,'promote_requested'=>false,'reason'=>$reason,'decided_by_user_id'=>$this->context->userId(),'decided_at'=>$now,'result'=>['source'=>$candidate->source,'fit_score'=>$candidate->fit_score]]);
        });
        $this->audit->record(['type'=>'resource_fallback.decision_recorded','company_id'=>$this->context->companyId(),'entity_type'=>'resource_fallback_request','entity_id'=>(string)$request->id,'candidate_id'=>(string)$candidate->id,'decision'=>$decision,'operational_need_type'=>$request->operational_need_type,'operational_need_public_id'=>$request->operational_need_public_id]);
        return $record;
    }

    /** @param array<int,string> $acceptedFields @param array<string,mixed> $execution */
    public function promote(ResourceFallbackRequest $request,string $candidateId,array $acceptedFields,array $execution=[]): array
    {
        $this->assertRequest($request,'titan-maps-intelligence.resource-fallback.promote');
        $candidate=ResourceFallbackCandidate::query()->forCompany($this->context->companyId())->where('fallback_request_id',$request->id)->whereKey($candidateId)->firstOrFail();
        if($candidate->source!=='discovery'||!$candidate->discovery_candidate_id)throw MapsIntelligenceException::fromCode('MAPS_FALLBACK_PROMOTION_NOT_REQUIRED','Approved-network resources already exist operationally and must not be re-promoted.');
        if((string)$candidate->status!=='approved'||!hash_equals((string)($request->selected_candidate_id??''),(string)$candidate->id))throw MapsIntelligenceException::fromCode('MAPS_FALLBACK_APPROVAL_REQUIRED','Fallback promotion requires the selected candidate to be explicitly approved first.');
        $result=$this->promotions->promote($this->context->companyId(),(string)$candidate->discovery_candidate_id,(string)$request->resource_type,$acceptedFields,$execution+['user_id'=>$this->context->userId(),'branch_id'=>$this->context->branchId(),'workspace_id'=>$this->context->workspaceId(),'reason'=>$execution['reason']??'Promoted from governed resource fallback.']);
        $now=CarbonImmutable::now('UTC');
        DB::transaction(function()use($request,$candidate,$result,$now):void{
            $candidate->forceFill(['status'=>'promoted','promoted_at'=>$now,'promotion_target_entity_id'=>$result['entity_id']??null])->save();
            $request->forceFill(['status'=>'promoted','closed_at'=>$now])->save();
            ResourceFallbackDecision::query()->create(['company_id'=>$this->context->companyId(),'fallback_request_id'=>(string)$request->id,'fallback_candidate_id'=>(string)$candidate->id,'decision'=>'promote','promote_requested'=>true,'reason'=>'Explicit promotion after fallback approval.','decided_by_user_id'=>$this->context->userId(),'decided_at'=>$now,'result'=>['target_entity_id'=>$result['entity_id']??null,'command_id'=>$result['command_id']??null,'internal_approval_record'=>['promoted_by'=>$this->context->userId(),'promotion_reason'=>'Explicit promotion after fallback approval.']]]);
        });
        $this->audit->record(['type'=>'resource_fallback.promoted','company_id'=>$this->context->companyId(),'entity_type'=>'resource_fallback_request','entity_id'=>(string)$request->id,'candidate_id'=>(string)$candidate->id,'target_entity_id'=>$result['entity_id']??null,'operational_need_type'=>$request->operational_need_type,'operational_need_public_id'=>$request->operational_need_public_id]);
        return $result;
    }

    public function cancel(ResourceFallbackRequest $request,?string $reason=null): ResourceFallbackRequest
    {
        $this->assertRequest($request,'titan-maps-intelligence.resource-fallback.decide');
        $request->forceFill(['status'=>'cancelled','closed_at'=>now(),'metadata'=>array_merge((array)$request->metadata,['cancel_reason'=>$reason])])->save();
        $this->audit->record(['type'=>'resource_fallback.cancelled','company_id'=>$this->context->companyId(),'entity_type'=>'resource_fallback_request','entity_id'=>(string)$request->id,'operational_need_type'=>$request->operational_need_type,'operational_need_public_id'=>$request->operational_need_public_id]);
        return $request->fresh(['candidates','decisions'])??$request;
    }

    private function resolveTarget(string $companyId,?string $jobPublicId,?Coordinates $target): Coordinates
    {
        if($target)return $target;
        if($jobPublicId){$loc=MapLocation::query()->forCompany($companyId)->where('reference_type','job')->where('public_reference_id',$jobPublicId)->whereNotNull('latitude')->whereNotNull('longitude')->first();if($loc)return new Coordinates((float)$loc->latitude,(float)$loc->longitude);}
        throw MapsIntelligenceException::fromCode('MAPS_FALLBACK_TARGET_REQUIRED','A mapped job or explicit target coordinates are required for resource fallback.');
    }

    private function launchDiscovery(ResourceFallbackRequest $request,Coordinates $target): DiscoverySearch
    {
        $query=trim((string)($request->query??''));if($query==='')$query=trim((string)($request->service_key??''));if($query==='')$query=(string)$request->resource_type;
        if($request->resource_type==='contractor'&&!str_contains(strtolower($query),'contract'))$query.=' contractor';
        if($request->resource_type==='supplier'&&!str_contains(strtolower($query),'supplier'))$query.=' supplier';
        $purpose=$request->resource_type==='supplier'?'supplier_discovery':'emergency_sourcing';
        return $this->searches->create(new PlaceSearchRequest(query:$query,maximumResults:$this->configuration->fallbackDiscoveryResultLimit(),languageCode:'en',regionCode:null,locationBias:$target,radiusMetres:(float)$request->radius_metres,includedType:null,openNow:(bool)$request->open_now,minimumRating:null),['purpose'=>$purpose,'conversation_id'=>null,'agent_id'=>null,'correlation_id'=>(string)$request->id]);
    }

    /** @param array<string,mixed> $row */
    private function persistCandidate(ResourceFallbackRequest $request,array $row,int $rank): ResourceFallbackCandidate
    {
        $lookup=['company_id'=>$this->context->companyId(),'fallback_request_id'=>(string)$request->id,'source'=>(string)$row['source'],'source_public_id'=>(string)$row['source_public_id']];
        $values=$row+['company_id'=>$this->context->companyId(),'fallback_request_id'=>(string)$request->id,'rank'=>$rank,'status'=>'proposed'];
        $record=ResourceFallbackCandidate::query()->firstOrNew($lookup);$record->fill($values);if((string)$record->status==='')$record->status='proposed';$record->save();return $record;
    }

    private function assertRequest(ResourceFallbackRequest $request,string $permission): void
    {
        $companyId=$this->context->companyId();if(!hash_equals((string)$request->company_id,$companyId))throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED','Fallback request is outside the authorised company.');
        $this->authorizer->authorize($this->context->userId(),$companyId,$permission,['fallback_request_id'=>(string)$request->id]);
    }
}
