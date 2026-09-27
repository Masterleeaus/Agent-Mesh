<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\DispatchRecommendation;
final class ReadDispatchRecommendationsTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer) {}
    public function execute(array $input): array
    {
        $company=$this->context->companyId(); $this->authorizer->authorize($this->context->userId(),$company,'titan-maps-intelligence.dispatch.read');
        $limit=max(1,min(100,(int)($input['limit']??20)));
        $rows=DispatchRecommendation::query()->forCompany($company)->with('candidates')->latest('calculated_at')->limit($limit)->get();
        return ['ok'=>true,'data'=>$rows->map(fn($r)=>['recommendation_id'=>(string)$r->id,'job_public_id'=>(string)$r->job_public_id,'status'=>(string)$r->status,'recommended_worker_public_id'=>$r->recommended_worker_public_id,'selected_worker_public_id'=>$r->selected_worker_public_id,'calculated_at'=>$r->calculated_at?->toAtomString(),'candidates'=>$r->candidates->map(fn($c)=>['candidate_id'=>(string)$c->id,'rank'=>(int)$c->rank,'worker_public_id'=>(string)$c->worker_public_id,'eligible'=>(bool)$c->eligible,'score'=>(float)$c->total_score])->all()])->all()];
    }
}
