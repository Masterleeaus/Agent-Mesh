<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\DispatchAssignmentGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\DispatchEvidenceGateway;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\DispatchJobContext;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\Events\DispatchRecommendationApproved;
use App\Extensions\TitanMapsIntelligence\Events\DispatchRecommendationRejected;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\DispatchCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DispatchDecision;
use App\Extensions\TitanMapsIntelligence\Models\DispatchRecommendation;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class DispatchIntelligenceService
{
    public const SCORING_VERSION='dispatch-v1';

    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly DispatchEvidenceGateway $evidence,
        private readonly DispatchAssignmentGateway $assignments,
        private readonly DispatchScoreService $scores,
        private readonly DispatchScoringPolicyService $scoringPolicies,
        private readonly TravelMatrixService $matrices,
        private readonly LocationFreshnessPolicy $freshness,
        private readonly MapsConfiguration $configuration,
        private readonly RouteFreshnessPolicy $routeFreshness,
        private readonly WorkerLocationVisibilityPolicy $workerVisibility,
    ) {}

    /** @return DispatchRecommendation */
    public function recommend(string $jobPublicId, int $limit=10, string $travelMode='DRIVE', string $routingPreference='TRAFFIC_AWARE'): DispatchRecommendation
    {
        $companyId=$this->context->companyId();
        $limit=max(1,min($limit,$this->configuration->dispatchCandidateLimit()));
        $job=$this->evidence->job($companyId,$jobPublicId) ?? new DispatchJobContext($jobPublicId,'Job '.$jobPublicId);
        $target=$this->targetLocation($companyId,$job);
        $scoringPolicy=$this->scoringPolicies->resolve(isset($job->metadata['vertical'])?(string)$job->metadata['vertical']:null);
        $states=MapWorkerTrackingState::query()->forCompany($companyId)->where('tracking_allowed',true)->where('on_duty',true);
        if (! $this->workerVisibility->canReadCompanyWide($companyId)) $states->where('user_id',$this->context->userId());
        $states=$states->get();
        $workerIds=$states->pluck('worker_public_id')->all();
        $locations=MapLocation::query()->forCompany($companyId)->where('reference_type','worker')->where('source','gps')->whereIn('public_reference_id',$workerIds)->get()->keyBy('public_reference_id');
        $workers=[];
        foreach($states as $state){
            $location=$locations->get((string)$state->worker_public_id); if(!$location || $location->latitude===null || $location->longitude===null) continue;
            if($this->freshness->isStale('gps',$location->coordinates_verified_at)) continue;
            $workers[]=['state'=>$state,'location'=>$location,'worker_public_id'=>(string)$state->worker_public_id,'user_id'=>(string)$state->user_id];
        }

$matrixSnapshot=null; $matrixByIndex=[]; $matrixBasis='none'; $provider=null; $staleTooOld=false;
        if($workers!==[]){
            $origins=array_map(static fn(array $w):Coordinates=>new Coordinates((float)$w['location']->latitude,(float)$w['location']->longitude),$workers);
            $refs=array_map(static fn(array $w):array=>['reference_type'=>'worker','public_reference_id'=>$w['worker_public_id'],'label'=>'Worker '.$w['worker_public_id']],$workers);
            $calc=$this->matrices->calculate(new RouteMatrixRequest($origins,[new Coordinates((float)$target->latitude,(float)$target->longitude)],$travelMode,$routingPreference),$refs,[['reference_type'=>'job','public_reference_id'=>$jobPublicId,'label'=>$job->title]]);
            $matrixSnapshot=$calc['snapshot']; $matrixBasis=(string)$matrixSnapshot->result_basis; $provider=$matrixSnapshot->provider;
            if($matrixBasis==='stale_matrix_snapshot' && $matrixSnapshot->calculated_at!==null){
                $staleTooOld=$this->routeFreshness->mustRefresh($matrixSnapshot->calculated_at->getTimestamp(),null,7200);
                if($staleTooOld)$matrixBasis='stale_too_old_after_refresh_failure';
            }
            foreach($matrixSnapshot->elements as $element) $matrixByIndex[(int)$element->origin_index]=$element;
        }

        $candidateRows=[];
        foreach($workers as $index=>$worker){
            $state=$worker['state']; $location=$worker['location']; $element=$matrixByIndex[$index]??null;
            $usableElement=$staleTooOld?null:$element;
            $operational=$this->evidence->workerEvidence($companyId,$job,[
                'worker_public_id'=>$worker['worker_public_id'],'user_id'=>$worker['user_id'],'branch_id'=>$state->branch_id,
            ]);
            $territory=0.5;
            if($target->branch_id!==null && $state->branch_id!==null) $territory=hash_equals((string)$target->branch_id,(string)$state->branch_id)?1.0:0.0;
            $score=$this->scores->score($job->toArray(),$operational+[
                'worker_public_id'=>$worker['worker_public_id'],'worker_user_id'=>$worker['user_id'],'tracking_allowed'=>(bool)$state->tracking_allowed,'on_duty'=>(bool)$state->on_duty,
                'location_status'=>'fresh','territory_affinity'=>$territory,'eta_seconds'=>$usableElement?->duration_seconds,'distance_metres'=>$usableElement?->distance_metres,
                'straight_line_distance_metres'=>$element?->straight_line_distance_metres,
            ],$scoringPolicy['weights']);
            $candidateRows[]=[
                'worker_public_id'=>$worker['worker_public_id'],'worker_user_id'=>$worker['user_id'],'latitude'=>(float)$location->latitude,'longitude'=>(float)$location->longitude,
                'road_distance_metres'=>$usableElement?->distance_metres,'straight_line_distance_metres'=>$element?->straight_line_distance_metres,
                'duration_seconds'=>$usableElement?->duration_seconds,'traffic_delay_seconds'=>$usableElement?->traffic_delay_seconds,
                'eta_basis'=>$usableElement?->duration_seconds!==null?($matrixBasis==='stale_matrix_snapshot'?'stale_snapshot':'provider_eta'):'unavailable',
                'matrix_condition'=>$element?->condition,'score'=>$score,'operational'=>$operational,'territory_affinity'=>$territory,
            ];
        }
        usort($candidateRows,static function(array $a,array $b):int{ if($a['score']->blocked!==$b['score']->blocked)return $a['score']->blocked<=>$b['score']->blocked; $cmp=$b['score']->totalScore<=>$a['score']->totalScore; if($cmp!==0)return $cmp; return (($a['duration_seconds']??PHP_INT_MAX)<=>($b['duration_seconds']??PHP_INT_MAX)); });
        $candidateRows=array_slice($candidateRows,0,$limit);
        $recommended=null; foreach($candidateRows as $row){ if(!$row['score']->blocked){$recommended=$row;break;} }
        $now=CarbonImmutable::now('UTC');

        /** @var DispatchRecommendation $recommendation */
        $recommendation=DB::transaction(function()use($companyId,$job,$jobPublicId,$target,$travelMode,$routingPreference,$matrixSnapshot,$matrixBasis,$provider,$candidateRows,$recommended,$now,$scoringPolicy):DispatchRecommendation{
            $rec=DispatchRecommendation::query()->create([
                'company_id'=>$companyId,'branch_id'=>$target->branch_id??$this->context->branchId(),'workspace_id'=>$target->workspace_id??$this->context->workspaceId(),
                'job_public_id'=>$jobPublicId,'job_type'=>'work_order','job_title'=>$job->title,'priority'=>$job->priority,'target_latitude'=>$target->latitude,'target_longitude'=>$target->longitude,
                'scheduled_start'=>$job->scheduledStart,'scheduled_end'=>$job->scheduledEnd,'travel_mode'=>$travelMode,'routing_preference'=>$routingPreference,
                'matrix_snapshot_id'=>$matrixSnapshot?->id,'status'=>$recommended?'pending_approval':'no_eligible_candidate',
                'recommended_worker_public_id'=>$recommended['worker_public_id']??null,'recommended_worker_user_id'=>$recommended['worker_user_id']??null,
                'scoring_version'=>self::SCORING_VERSION.'+'.(string)$scoringPolicy['policy_version'],'weights'=>$scoringPolicy['weights'],'job_snapshot'=>$job->toArray(),
                'summary'=>['candidate_count'=>count($candidateRows),'eligible_count'=>count(array_filter($candidateRows,fn(array $r):bool=>!$r['score']->blocked)),'matrix_basis'=>$matrixBasis,'provider'=>$provider],
                'requested_by_user_id'=>$this->context->userId(),'calculated_at'=>$now,'expires_at'=>$now->addSeconds($this->configuration->dispatchRecommendationTtlSeconds()),
                'metadata'=>['configuration_version'=>$this->configuration->version()],
            ]);
            foreach($candidateRows as $rank=>$row){
                /** @var \App\Extensions\TitanMapsIntelligence\DTO\DispatchScoreResult $score */ $score=$row['score'];
                DispatchCandidate::query()->create([
                    'company_id'=>$companyId,'dispatch_recommendation_id'=>(string)$rec->id,'worker_public_id'=>$row['worker_public_id'],'worker_user_id'=>$row['worker_user_id'],'rank'=>$rank+1,
                    'eligible'=>!$score->blocked,'blocked'=>$score->blocked,'total_score'=>$score->totalScore,'latitude'=>$row['latitude'],'longitude'=>$row['longitude'],
                    'road_distance_metres'=>$row['road_distance_metres'],'straight_line_distance_metres'=>$row['straight_line_distance_metres'],'duration_seconds'=>$row['duration_seconds'],'traffic_delay_seconds'=>$row['traffic_delay_seconds'],
                    'eta_basis'=>$row['eta_basis'],'matrix_condition'=>$row['matrix_condition'],'dimensions'=>$score->dimensions,'evidence'=>$score->evidence,
                    'blockers'=>$score->blockers,'explanations'=>$score->explanations,'metadata'=>['operational'=>$row['operational'],'territory_affinity'=>$row['territory_affinity']],
                ]);
            }
            return $rec;
        });
        return $recommendation->fresh(['candidates','decisions'])??$recommendation;
    }

    public function decide(DispatchRecommendation $recommendation, string $decision, ?string $candidateId=null, bool $assign=false, ?string $reason=null): DispatchDecision
    {
        $this->assertCompany($recommendation);
        if(!in_array($decision,['approve','reject'],true)) throw MapsIntelligenceException::fromCode('MAPS_DISPATCH_DECISION_INVALID','Dispatch decision must be approve or reject.');
        if((string)$recommendation->status!=='pending_approval') throw MapsIntelligenceException::fromCode('MAPS_DISPATCH_STATE_INVALID','This recommendation is no longer awaiting a decision.');
        if ($recommendation->expires_at !== null && $recommendation->expires_at->isPast()) throw MapsIntelligenceException::fromCode('MAPS_DISPATCH_RECOMMENDATION_EXPIRED','This dispatch recommendation has expired and must be recalculated.');
        $candidate=null;
        if($candidateId!==null){ $candidate=DispatchCandidate::query()->forCompany($this->context->companyId())->where('dispatch_recommendation_id',$recommendation->id)->whereKey($candidateId)->first(); if(!$candidate)throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED','Dispatch candidate is not available in this recommendation.'); }
        if($decision==='approve' && ($candidate===null || $candidate->blocked)) throw MapsIntelligenceException::fromCode('MAPS_DISPATCH_CANDIDATE_BLOCKED','An eligible candidate is required for approval.');
        $jobData=(array)$recommendation->job_snapshot; $job=new DispatchJobContext(
            publicId:(string)$recommendation->job_public_id,title:(string)($recommendation->job_title??('Job '.$recommendation->job_public_id)),priority:(string)$recommendation->priority,
            scheduledStart:$recommendation->scheduled_start?->toAtomString(),scheduledEnd:$recommendation->scheduled_end?->toAtomString(),
            servicePublicId:$jobData['service_public_id']??null,locationPublicId:$jobData['location_public_id']??null,companyPublicId:$jobData['company_public_id']??null,contactPublicId:$jobData['contact_public_id']??null,
            requiredSkills:(array)($jobData['required_skills']??[]),requiredCertifications:(array)($jobData['required_certifications']??[]),metadata:(array)($jobData['metadata']??[]),
        );
        $assignment=['status'=>'not_requested','reference'=>null];
        if($decision==='approve' && $assign){ $assignment=$this->assignments->assign($this->context->companyId(),$job,['worker_public_id'=>(string)$candidate->worker_public_id,'worker_user_id'=>(string)$candidate->worker_user_id],[
            'actor_user_id'=>$this->context->userId(),'recommendation_id'=>(string)$recommendation->id,'dispatch_candidate_rank'=>(int)$candidate->rank,
        ]); }
        $record=DB::transaction(function()use($recommendation,$candidate,$decision,$assign,$reason,$assignment):DispatchDecision{
            $recommendation->status=$decision==='approve'?'approved':'rejected';
            if($decision==='approve' && $candidate){$recommendation->selected_worker_public_id=(string)$candidate->worker_public_id;$recommendation->selected_worker_user_id=(string)$candidate->worker_user_id;}
            $recommendation->save();
            return DispatchDecision::query()->create([
                'company_id'=>$this->context->companyId(),'dispatch_recommendation_id'=>(string)$recommendation->id,'dispatch_candidate_id'=>$candidate?->id,
                'decision'=>$decision,'worker_public_id'=>$candidate?->worker_public_id,'worker_user_id'=>$candidate?->worker_user_id,'assignment_requested'=>$assign,
                'assignment_status'=>(string)($assignment['status']??'not_requested'),'assignment_reference'=>$assignment['reference']??null,'reason'=>$reason,
                'decided_by_user_id'=>$this->context->userId(),'decided_at'=>CarbonImmutable::now('UTC'),'result'=>$assignment,
            ]);
        });
        if($decision==='approve' && $candidate) event(new DispatchRecommendationApproved($this->context->companyId(),(string)$recommendation->id,(string)$recommendation->job_public_id,(string)$candidate->worker_public_id,(string)($assignment['status']??'not_requested')));
        else event(new DispatchRecommendationRejected($this->context->companyId(),(string)$recommendation->id,$candidate?->worker_public_id,$reason));
        return $record;
    }

    private function targetLocation(string $companyId, DispatchJobContext $job): MapLocation
    {
        $location=MapLocation::query()->forCompany($companyId)->where('reference_type','job')->where('public_reference_id',$job->publicId)->first();
        if(!$location && $job->locationPublicId) $location=MapLocation::query()->forCompany($companyId)->where('reference_type','property')->where('public_reference_id',$job->locationPublicId)->first();
        if(!$location || $location->latitude===null || $location->longitude===null) throw MapsIntelligenceException::fromCode('MAPS_DISPATCH_JOB_LOCATION_MISSING','The job needs a company-scoped canonical location before dispatch scoring can run.');
        return $location;
    }

    private function assertCompany(DispatchRecommendation $recommendation): void
    {
        if(!hash_equals($this->context->companyId(),(string)$recommendation->company_id)) throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED','Dispatch recommendation belongs to another company.');
    }
}
