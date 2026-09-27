<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Models\ResourceFallbackRequest;
use App\Extensions\TitanMapsIntelligence\Services\ResourceFallbackService;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
final class DecideResourceFallbackTool
{
 public function __construct(private readonly AuthorisedCompanyContext $context,private readonly ResourceFallbackService $service,private readonly GovernedSpatialCapabilityExecutor $governance) {}
 public function execute(array $input): array
 {
  if(($input['confirmed']??false)!==true)return ['ok'=>false,'error'=>['code'=>'MAPS_CONFIRMATION_REQUIRED','message'=>'Fallback approve/reject decisions require confirmed=true.']];
  $input['execution_origin']='ai';
  return $this->governance->execute('titan-maps-intelligence.resource-fallback.decide',$input,function()use($input){$r=ResourceFallbackRequest::query()->forCompany($this->context->companyId())->whereKey((string)($input['fallback_request_id']??''))->firstOrFail();$d=$this->service->decide($r,(string)($input['candidate_id']??''),(string)($input['decision']??''),$input['reason']??null);return $d->toArray();});
 }
}
