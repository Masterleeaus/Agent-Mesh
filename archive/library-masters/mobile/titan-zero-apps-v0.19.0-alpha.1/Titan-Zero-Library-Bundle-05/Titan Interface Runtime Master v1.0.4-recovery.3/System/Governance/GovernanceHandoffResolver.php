<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Governance;

use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionDescriptor;

final class GovernanceHandoffResolver
{
    /** @param array<string,mixed> $state @return list<array<string,mixed>> */
    public function resolve(array $state, ActionDescriptor $action): array
    {
        $intents=[];
        foreach($state['handoffs']??[] as $handoff){
            if(!is_array($handoff))continue;$op=(string)($handoff['operation']??'');if($op==='')continue;
            $intents[]=$this->intent($op,(string)($handoff['kind']??'source'),['ref'=>$handoff['ref']??null,'method'=>$handoff['method']??'POST','parameters'=>$handoff['parameters']??[]]);
        }
        $approval=$state['approval']??[];$approvalId=is_array($approval)?($approval['approval_id']??null):null;$approvalSource=is_array($approval)?($approval['source_ref']??null):null;
        if(is_string($approvalId)&&$approvalId!==''&&($approval['required']??false)===true&&($approval['status']??null)==='pending'&&$this->isTitanAi($approvalSource,$state)){
            $intents[]=$this->intent('approve','route',['route_name'=>'dashboard.user.titan-ai.governance.approvals.approve','parameters'=>['approvalId'=>$approvalId],'method'=>'POST']);
            $intents[]=$this->intent('reject','route',['route_name'=>'dashboard.user.titan-ai.governance.approvals.reject','parameters'=>['approvalId'=>$approvalId],'method'=>'POST']);
        }
        $execution=$state['execution']??[];
        if(is_array($execution)&&in_array($execution['status']??null,['not_started','queued'],true)&&(($approval['required']??false)!==true||in_array($approval['status']??null,['approved','not_required'],true))){
            if($action->capabilityRef!==null)$intents[]=$this->intent('execute','governed-capability',['capability_ref'=>$action->capabilityRef]);
            elseif($action->interaction!==null)$intents[]=$this->intent('execute','interaction-engine',['interaction'=>$action->interaction]);
        }
        $receipt=$state['receipt']??null;$rollback=$state['rollback']??[];
        if($receipt instanceof \App\Extensions\TitanInterfaceRuntime\System\Receipts\InterfaceReceipt&&($rollback['available']??false)===true){
            if($this->isTitanAi($rollback['source_ref']??null,$state)||$receipt->sourceAuthority==='titan-ai'){
                $intents[]=$this->intent('rollback','route',['route_name'=>'dashboard.user.titan-ai.governance.receipts.rollback','parameters'=>['receiptId'=>$receipt->receiptId],'method'=>'POST']);
            }elseif(is_string($rollback['capability_ref']??null)&&$rollback['capability_ref']!==''){
                $intents[]=$this->intent('rollback','governed-capability',['capability_ref'=>$rollback['capability_ref']]);
            }elseif(is_string($rollback['interaction_ref']??null)&&$rollback['interaction_ref']!==''){
                $intents[]=$this->intent('rollback','interaction-engine',['interaction_ref'=>$rollback['interaction_ref']]);
            }
        }
        $seen=[];$out=[];
        foreach($intents as$intent){$key=hash('sha256',json_encode([$intent['operation'],$intent['kind'],$intent['handoff']],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE));if(isset($seen[$key]))continue;$seen[$key]=true;$out[]=$intent;}
        return$out;
    }

    /** @param array<string,mixed> $handoff @return array<string,mixed> */
    private function intent(string $operation,string $kind,array $handoff):array
    {
        return ['operation'=>$operation,'kind'=>$kind,'executable'=>false,'handoff'=>$handoff,'authority'=>'source-governance','requires_fresh_governance'=>true];
    }

    /** @param array<string,mixed> $state */
    private function isTitanAi(mixed $source,array $state):bool
    {
        if($source==='titan-ai')return true;$p=$state['provenance']??[];return is_array($p)&&($p['authority']??null)==='titan-ai';
    }
}
