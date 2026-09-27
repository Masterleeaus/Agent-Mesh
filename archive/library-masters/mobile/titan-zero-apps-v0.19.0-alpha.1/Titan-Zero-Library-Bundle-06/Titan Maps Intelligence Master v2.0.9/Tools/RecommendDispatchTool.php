<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\DispatchIntelligenceService;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
final class RecommendDispatchTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer, private readonly DispatchIntelligenceService $dispatch, private readonly MapsConfiguration $configuration) {}
    public function execute(array $input): array
    {
        $company=$this->context->companyId(); $this->authorizer->authorize($this->context->userId(),$company,'titan-maps-intelligence.dispatch.recommend');
        $rec=$this->dispatch->recommend((string)($input['job_public_id']??''),(int)($input['limit']??min(10,$this->configuration->dispatchCandidateLimit())),(string)($input['travel_mode']??'DRIVE'),(string)($input['routing_preference']??'TRAFFIC_AWARE'));
        $rec->loadMissing('candidates');
        return ['ok'=>true,'data'=>['recommendation_id'=>(string)$rec->id,'status'=>(string)$rec->status,'job_public_id'=>(string)$rec->job_public_id,'recommended_worker_public_id'=>$rec->recommended_worker_public_id,'candidates'=>$rec->candidates->map(fn($c)=>['candidate_id'=>(string)$c->id,'rank'=>(int)$c->rank,'worker_public_id'=>(string)$c->worker_public_id,'eligible'=>(bool)$c->eligible,'score'=>(float)$c->total_score,'duration_seconds'=>$c->duration_seconds,'dimensions'=>$c->dimensions,'blockers'=>$c->blockers,'explanations'=>$c->explanations])->all()]];
    }
}
