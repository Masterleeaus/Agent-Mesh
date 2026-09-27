<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Models\ResourceFallbackRequest;
use App\Extensions\TitanMapsIntelligence\Services\ResourceFallbackService;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
final class PromoteResourceFallbackTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context,private readonly ResourceFallbackService $service,private readonly GovernedSpatialCapabilityExecutor $governance) {}
    public function execute(array $input): array
    {
        if(($input['confirmed']??false)!==true)return ['ok'=>false,'error'=>['code'=>'MAPS_CONFIRMATION_REQUIRED','message'=>'Fallback promotion requires confirmed=true.']];
        $input['execution_origin']='ai';
        return $this->governance->execute('titan-maps-intelligence.resource-fallback.promote',$input,function()use($input){$r=ResourceFallbackRequest::query()->forCompany($this->context->companyId())->whereKey((string)($input['fallback_request_id']??''))->firstOrFail();return $this->service->promote($r,(string)($input['candidate_id']??''),(array)($input['accepted_fields']??[]),$input);});
    }
}
