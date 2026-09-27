<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
use App\Extensions\TitanMapsIntelligence\Services\JobTravelContextService;
final class GetJobTravelContextTool
{
 public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly JobTravelContextService $service,private readonly GovernedSpatialCapabilityExecutor $governance){}
 public function execute(array $input): array{$input['execution_origin']='ai';$c=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$c,'titan-maps-intelligence.job.travel-context.read');$job=(string)$input['job_public_id'];return $this->governance->execute('job.travel_context',$input,fn($execution)=>$this->service->context($job,isset($input['branch_public_id'])?(string)$input['branch_public_id']:null,isset($input['service_key'])?(string)$input['service_key']:null,$execution),['job_public_id'=>$job]);}
}
