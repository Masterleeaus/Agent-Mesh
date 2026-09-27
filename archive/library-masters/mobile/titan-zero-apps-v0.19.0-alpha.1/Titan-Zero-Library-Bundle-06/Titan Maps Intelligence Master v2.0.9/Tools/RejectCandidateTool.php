<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\CandidateReviewService;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
final class RejectCandidateTool
{
 public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly CandidateReviewService $reviews,private readonly GovernedSpatialCapabilityExecutor $governance){}
 public function execute(array $input): array
 {
  $this->authorizer->authorize($this->context->userId(),$this->context->companyId(),'titan-maps-intelligence.candidate.reject');
  if(($input['confirmed']??false)!==true)return ['ok'=>false,'error'=>['code'=>'MAPS_CONFIRMATION_REQUIRED','message'=>'Candidate rejection requires explicit confirmation.']];
  $input['execution_origin']='ai';
  return $this->governance->execute('titan-maps-intelligence.candidate.reject',$input,function()use($input){$candidate=$this->reviews->reject((string)($input['candidate_id']??''),(string)($input['reason']??''),['agent_id'=>$input['agent_id']??null,'conversation_id'=>$input['conversation_id']??null,'correlation_id'=>$input['correlation_id']??null]);return ['candidate_id'=>$candidate->getKey(),'review_status'=>$candidate->review_status];});
 }
}
