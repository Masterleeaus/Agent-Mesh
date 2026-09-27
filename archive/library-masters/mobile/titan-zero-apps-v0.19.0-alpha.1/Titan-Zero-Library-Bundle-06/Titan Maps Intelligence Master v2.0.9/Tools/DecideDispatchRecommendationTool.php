<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\DispatchRecommendation;
use App\Extensions\TitanMapsIntelligence\Services\DispatchIntelligenceService;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
final class DecideDispatchRecommendationTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly DispatchIntelligenceService $dispatch,private readonly GovernedSpatialCapabilityExecutor $governance) {}
    public function execute(array $input): array
    {
        $company=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$company,'titan-maps-intelligence.dispatch.manage');
        if(($input['confirmed']??false)!==true)return ['ok'=>false,'error'=>['code'=>'MAPS_CONFIRMATION_REQUIRED','message'=>'Dispatch decisions require explicit confirmation.']];
        $input['execution_origin']='ai';
        return $this->governance->execute('titan-maps-intelligence.dispatch.decide',$input,function()use($input,$company){$rec=DispatchRecommendation::query()->forCompany($company)->whereKey((string)($input['recommendation_id']??''))->firstOrFail();$decision=$this->dispatch->decide($rec,(string)($input['decision']??''),isset($input['candidate_id'])?(string)$input['candidate_id']:null,(bool)($input['assign']??false),isset($input['reason'])?(string)$input['reason']:null);return ['decision_id'=>(string)$decision->id,'decision'=>(string)$decision->decision,'assignment_requested'=>(bool)$decision->assignment_requested,'assignment_status'=>(string)$decision->assignment_status,'assignment_reference'=>$decision->assignment_reference];});
    }
}
