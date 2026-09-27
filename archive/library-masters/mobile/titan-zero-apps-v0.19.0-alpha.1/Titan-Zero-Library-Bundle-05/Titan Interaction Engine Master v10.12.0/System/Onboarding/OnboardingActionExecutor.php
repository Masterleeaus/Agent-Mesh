<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Onboarding;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Command\CommandBus;
use App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\InMemoryOnboardingExecutionLedger;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingExecutionLedgerInterface;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingApprovalStoreInterface;
use App\Extensions\InteractionEngine\System\Registry\CapabilityRegistry;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

final class OnboardingActionExecutor
{
    private OnboardingExecutionLedgerInterface $ledger;
    public function __construct(
        private readonly CapabilityRegistry $capabilities,
        private readonly CommandBusInterface $commands,
        private readonly CompanyExecutionContext $tenantContext,
        ?OnboardingExecutionLedgerInterface $ledger=null,
        private readonly ?OnboardingReadinessService $readiness=null,
        private readonly ?OnboardingApprovalStoreInterface $approvalStore=null,
    ){$this->ledger=$ledger??new InMemoryOnboardingExecutionLedger();}

    /** @param list<string> $_deprecatedApprovalIds Ignored: approvals must come from the server-side approval store. */
    public function execute(OnboardingPlan $plan,array $_deprecatedApprovalIds,array $executionContext=[]):OnboardingExecutionResult
    {
        $companyId=$this->tenantContext->companyId();if($plan->companyId!==$companyId)throw new \RuntimeException('Onboarding plan company_id does not match trusted company_id.');
        $actor=$this->currentActor($executionContext,$companyId);$results=[];$byId=[];
        $actions=$plan->actions;usort($actions,static fn(OnboardingAction$a,OnboardingAction$b)=>$a->executionOrder<=>$b->executionOrder);
        foreach($actions as$action){
            $previous=$this->ledger->result($companyId,$plan->id,$action->id);
            if(($previous['status']??null)==='executed'){$result=['action_id'=>$action->id,'capability'=>$action->capability,'provider'=>$action->provider,'status'=>'already_executed'];$results[]=$result;$byId[$action->id]=$result;continue;}
            $blocked=$this->blockedDependencies($action,$companyId,$plan->id,$byId);
            if($blocked!==[]){$result=['action_id'=>$action->id,'capability'=>$action->capability,'provider'=>$action->provider,'status'=>'blocked_dependency','reason'=>'Dependencies are not complete.','dependencies'=>$blocked];$this->record($companyId,$plan->id,$action->id,$result,$results,$byId);continue;}
            $approvalGrant=null;
            if($action->requiresApproval){
                if($this->approvalStore!==null){$approvalGrant=$this->approvalStore->get($companyId,$plan->id,$action->id);}
                if(!is_array($approvalGrant)){$result=['action_id'=>$action->id,'capability'=>$action->capability,'provider'=>$action->provider,'status'=>'pending_approval'];$this->record($companyId,$plan->id,$action->id,$result,$results,$byId);continue;}
            }
            $payload=$this->payloadForCurrentActor($action,$plan,$actor);if(is_array($approvalGrant))$payload['_approval']=$approvalGrant;$capContext=CapabilityExecutionContext::fromPayload($payload);
            if($action->group==='activation'&&$this->readiness!==null){$ready=$this->readiness->aggregate($plan,$capContext);if(($ready['status']??'blocked')==='blocked'){$result=['action_id'=>$action->id,'capability'=>$action->capability,'provider'=>$action->provider,'status'=>'blocked_dependency','reason'=>'Required Titan subsystems are not ready.','readiness'=>$ready];$this->record($companyId,$plan->id,$action->id,$result,$results,$byId);continue;}}
            $status=$this->capabilities->status($action->capability,$capContext);
            if(!($status['available']??false)&&!$this->capabilities->isLocal($action->capability)){$result=['action_id'=>$action->id,'capability'=>$action->capability,'provider'=>$action->provider,'status'=>'unavailable','reason'=>$status['reason']??'Owning provider capability is unavailable for this company.'];$this->record($companyId,$plan->id,$action->id,$result,$results,$byId);continue;}
            try{
                if($this->commands instanceof CommandBus){$outcome=$this->commands->dispatchResult($action->capability,$payload);$result=['action_id'=>$action->id,'capability'=>$outcome->capability,'provider'=>$outcome->provider,'status'=>$outcome->status,'reason'=>$outcome->reason,'data'=>$outcome->data];}
                else{$this->commands->dispatch($action->capability,$payload);$result=['action_id'=>$action->id,'capability'=>$action->capability,'provider'=>$action->provider,'status'=>'executed'];}
            }catch(\Throwable$e){$result=['action_id'=>$action->id,'capability'=>$action->capability,'provider'=>$action->provider,'status'=>'failed','reason'=>'Interaction capability execution failed.','error_class'=>$e::class];}
            $this->record($companyId,$plan->id,$action->id,$result,$results,$byId);
        }
        return new OnboardingExecutionResult($plan->id,$companyId,$results);
    }

    private function blockedDependencies(OnboardingAction$action,string$companyId,string$planId,array$byId):array
    {
        $blocked=[];foreach($action->dependencies as$id){$state=$byId[$id]??$this->ledger->result($companyId,$planId,$id);if(!in_array((string)($state['status']??''),['executed','already_executed'],true))$blocked[]=$id;}return$blocked;
    }
    private function record(string$companyId,string$planId,string$actionId,array$result,array&$results,array&$byId):void{$this->ledger->record($companyId,$planId,$actionId,$result);$results[]=$result;$byId[$actionId]=$result;}
    private function currentActor(array$context,string$companyId):array
    {
        if((string)($context['company_id']??'')!==$companyId)throw new \RuntimeException('Current actor company_id does not match onboarding company_id.');
        if(isset($context['company_id'])&&(string)$context['company_id']!==$companyId)throw new \RuntimeException('company_id does not match trusted company_id.');
        $userId=trim((string)($context['user_id']??$context['actor_id']??''));if($userId===''||(string)($context['actor_type']??'')!=='human')throw new \RuntimeException('Onboarding execution requires a current authenticated human actor.');
        return array_replace($context,['company_id'=>$companyId,'user_id'=>$userId,'actor_id'=>$userId,'roles'=>array_values(array_map('strval',(array)($context['roles']??[]))),'source_surface'=>(string)($context['source_surface']??'zero'),'journey'=>(string)($context['journey']??'onboarding')]);
    }
    private function payloadForCurrentActor(OnboardingAction$action,OnboardingPlan$plan,array$actor):array
    {
        $payload=$action->payload;$stored=(array)($payload['_context']??[]);foreach(['user_id','actor_id','roles','delegated_scopes','authenticated_at','actor_type']as$key)unset($stored[$key]);
        $payload['_context']=array_replace($stored,$actor,['company_id'=>$plan->companyId,'source_surface'=>'zero','journey'=>'onboarding','onboarding_plan_id'=>$plan->id,'onboarding_action_id'=>$action->id,'idempotency_key'=>hash('sha256',$plan->companyId.'|'.$plan->id.'|'.$action->id)]);return$payload;
    }
}
