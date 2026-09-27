<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlan;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlanStop;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
use App\Extensions\TitanMapsIntelligence\Services\RoutePlanService;
final class ManageRoutePlanTool
{
 public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly RoutePlanService $plans,private readonly GovernedSpatialCapabilityExecutor $governance){}
 public function execute(array $input): array
 {
  $companyId=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$companyId,'titan-maps-intelligence.route-plan.manage');
  $input['execution_origin']='ai';
  return $this->governance->execute('titan-maps-intelligence.route-plan.manage',$input,fn()=> $this->perform($input,$companyId));
 }
 private function perform(array $input,string $companyId): array
 {
  $action=(string)($input['action']??'create');
  if($action==='create'){$plan=$this->plans->create($input);return ['plan_id'=>(string)$plan->id,'current_run_id'=>$plan->current_run_id,'status'=>$plan->status];}
  $plan=RoutePlan::query()->forCompany($companyId)->whereKey((string)($input['plan_id']??''))->firstOrFail();
  if($action==='optimise'){$run=$this->plans->optimise($plan,'ai_tool',(bool)($input['render_geometry']??false));return ['plan_id'=>(string)$plan->id,'run_id'=>(string)$run->id,'revision'=>(int)$run->revision,'basis'=>$run->result_basis];}
  if($action==='emergency'){$run=$this->plans->insertEmergencyStop($plan,(array)($input['stop']??[]),(bool)($input['render_geometry']??false));return ['plan_id'=>(string)$plan->id,'run_id'=>(string)$run->id,'revision'=>(int)$run->revision];}
  if($action==='stop_status'){$stop=RoutePlanStop::query()->forCompany($companyId)->where('route_plan_id',$plan->id)->whereKey((string)($input['stop_id']??''))->firstOrFail();$run=$this->plans->setStopStatus($plan,$stop,(string)($input['status']??''),(bool)($input['render_geometry']??false));return ['plan_id'=>(string)$plan->id,'run_id'=>$run?->id,'status'=>$plan->fresh()?->status];}
  throw MapsIntelligenceException::fromCode('MAPS_ROUTE_PLAN_ACTION_INVALID','Unsupported route-plan action.');
 }
}
