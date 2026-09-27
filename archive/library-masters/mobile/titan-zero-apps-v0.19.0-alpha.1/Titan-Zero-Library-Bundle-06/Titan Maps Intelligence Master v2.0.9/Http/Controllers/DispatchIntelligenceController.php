<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\DispatchCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DispatchRecommendation;
use App\Extensions\TitanMapsIntelligence\Services\DispatchIntelligenceService;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class DispatchIntelligenceController
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly DispatchIntelligenceService $dispatch,
        private readonly MapsConfiguration $configuration,
    ) {}

    public function recommend(Request $request): JsonResponse
    {
        $data = $request->validate([
            'job_public_id'=>['required','string','max:191'],
            'limit'=>['nullable','integer','min:1','max:'.$this->configuration->dispatchCandidateLimit()],
            'travel_mode'=>['nullable','in:DRIVE,WALK,BICYCLE,TWO_WHEELER,TRANSIT'],
            'routing_preference'=>['nullable','in:TRAFFIC_UNAWARE,TRAFFIC_AWARE,TRAFFIC_AWARE_OPTIMAL'],
        ]);
        try {
            $rec = $this->dispatch->recommend(
                (string)$data['job_public_id'],
                (int)($data['limit'] ?? min(10, $this->configuration->dispatchCandidateLimit())),
                (string)($data['travel_mode'] ?? 'DRIVE'),
                (string)($data['routing_preference'] ?? 'TRAFFIC_AWARE'),
            );
            return response()->json(['data'=>$this->present($rec)], 201);
        } catch (MapsIntelligenceException $exception) {
            return response()->json(['error'=>$exception->toSafeArray()], 422);
        }
    }

    public function history(Request $request): JsonResponse
    {
        $limit = max(1, min(100, (int)$request->query('limit', 30)));
        $rows = DispatchRecommendation::query()->forCompany($this->context->companyId())
            ->with(['candidates','decisions'])->latest('calculated_at')->limit($limit)->get();
        return response()->json(['data'=>$rows->map(fn(DispatchRecommendation $rec): array=>$this->present($rec))->all()]);
    }

    public function show(DispatchRecommendation $mapsDispatchRecommendation): JsonResponse
    {
        return response()->json(['data'=>$this->present($mapsDispatchRecommendation)]);
    }

    public function decide(Request $request, DispatchRecommendation $mapsDispatchRecommendation): JsonResponse
    {
        $data = $request->validate([
            'decision'=>['required','in:approve,reject'],
            'candidate_id'=>['nullable','string','max:64'],
            'assign'=>['nullable','boolean'],
            'reason'=>['nullable','string','max:1000'],
        ]);
        try {
            $decision = $this->dispatch->decide(
                $mapsDispatchRecommendation,
                (string)$data['decision'],
                isset($data['candidate_id']) ? (string)$data['candidate_id'] : null,
                (bool)($data['assign'] ?? false),
                isset($data['reason']) ? (string)$data['reason'] : null,
            );
            $fresh = $mapsDispatchRecommendation->fresh(['candidates','decisions']) ?? $mapsDispatchRecommendation;
            return response()->json(['data'=>['recommendation'=>$this->present($fresh),'decision'=>[
                'id'=>(string)$decision->id,'decision'=>(string)$decision->decision,'assignment_requested'=>(bool)$decision->assignment_requested,
                'assignment_status'=>(string)$decision->assignment_status,'assignment_reference'=>$decision->assignment_reference,
            ]]  ]);
        } catch (MapsIntelligenceException $exception) {
            return response()->json(['error'=>$exception->toSafeArray()], 422);
        }
    }

    /** @return array<string,mixed> */
    private function present(DispatchRecommendation $rec): array
    {
        $rec->loadMissing(['candidates','decisions']);
        $candidates = $rec->candidates->map(static function(DispatchCandidate $candidate): array {
            return [
                'id'=>(string)$candidate->id,'rank'=>(int)$candidate->rank,'worker_public_id'=>(string)$candidate->worker_public_id,
                'worker_user_id'=>(string)$candidate->worker_user_id,'eligible'=>(bool)$candidate->eligible,'blocked'=>(bool)$candidate->blocked,
                'score'=>(float)$candidate->total_score,'lat'=>(float)$candidate->latitude,'lng'=>(float)$candidate->longitude,
                'road_distance_metres'=>$candidate->road_distance_metres,'straight_line_distance_metres'=>$candidate->straight_line_distance_metres,
                'duration_seconds'=>$candidate->duration_seconds,'traffic_delay_seconds'=>$candidate->traffic_delay_seconds,'eta_basis'=>$candidate->eta_basis,
                'dimensions'=>$candidate->dimensions ?? [],'evidence'=>$candidate->evidence ?? [],'blockers'=>$candidate->blockers ?? [],'explanations'=>$candidate->explanations ?? [],
            ];
        })->values()->all();
        return [
            'id'=>(string)$rec->id,'job_public_id'=>(string)$rec->job_public_id,'job_title'=>(string)($rec->job_title ?: $rec->job_public_id),
            'priority'=>(string)$rec->priority,'status'=>(string)$rec->status,'recommended_worker_public_id'=>$rec->recommended_worker_public_id,
            'recommended_worker_user_id'=>$rec->recommended_worker_user_id,'selected_worker_public_id'=>$rec->selected_worker_public_id,
            'scoring_version'=>(string)$rec->scoring_version,'weights'=>$rec->weights ?? [],'summary'=>$rec->summary ?? [],
            'calculated_at'=>$rec->calculated_at?->toAtomString(),'expires_at'=>$rec->expires_at?->toAtomString(),'candidates'=>$candidates,
            'job_marker'=>['lat'=>(float)$rec->target_latitude,'lng'=>(float)$rec->target_longitude,'type'=>'job','label'=>(string)($rec->job_title ?: ('Job '.$rec->job_public_id))],
            'actions'=>[
                'show'=>route('dashboard.user.titan-maps-intelligence.field.dispatch.show',['mapsDispatchRecommendation'=>$rec->id]),
                'decide'=>route('dashboard.user.titan-maps-intelligence.field.dispatch.decide',['mapsDispatchRecommendation'=>$rec->id]),
            ],
        ];
    }
}
