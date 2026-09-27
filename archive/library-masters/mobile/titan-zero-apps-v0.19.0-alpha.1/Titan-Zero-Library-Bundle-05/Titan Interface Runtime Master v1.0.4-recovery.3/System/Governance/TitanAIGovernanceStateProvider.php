<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Governance;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceStateProviderContract;

/**
 * Soft compatibility adapter over TitanAI's authoritative ApprovalQueue contract.
 * It never reads TitanAI tables directly and intentionally does not fabricate
 * execution receipts that TitanAI has not exposed through a read contract.
 */
final readonly class TitanAIGovernanceStateProvider implements GovernanceStateProviderContract
{
    private const QUEUE = 'App\\Extensions\\TitanAI\\System\\Governance\\Approvals\\ApprovalQueue';

    public function __construct(private object $container) {}

    public function inspect(InterfaceContext $context, string $providerKey, array $subject): GovernanceStateResult
    {
        $queue=$this->resolveQueue();
        if($queue===null){
            return $this->unavailable($context,$providerKey,'TitanAI ApprovalQueue is not available on this host.');
        }
        $companyId=is_int($context->companyId)?$context->companyId:(ctype_digit((string)$context->companyId)?(int)$context->companyId:0);
        if($companyId<1)return $this->unavailable($context,$providerKey,'TitanAI ApprovalQueue requires a positive numeric company id.');

        $approval=null;$requestedApproval=$this->safeId($subject['approval_id']??null);
        try{
            if($requestedApproval!==null&&method_exists($queue,'find'))$approval=$queue->find($requestedApproval,$companyId);
            elseif(method_exists($queue,'pending')){
                $capability=$this->safeId($subject['capability_ref']??null);$actionKey=$this->safeId($subject['action_key']??null);
                foreach((array)$queue->pending($companyId) as$item){if(!is_array($item))continue;$candidate=(string)($item['action']??'');if($candidate!==''&&($candidate===$capability||$candidate===$actionKey)){$approval=$item;break;}}
            }
        }catch(\Throwable){return $this->unavailable($context,$providerKey,'TitanAI governance state could not be read through its authority contract.');}
        if(!is_array($approval))return $this->unavailable($context,$providerKey,'No matching TitanAI governance lifecycle state is currently available.');

        $rowCompany=(int)($approval['company_id']??0);if($rowCompany!==$companyId)return $this->unavailable($context,$providerKey,'TitanAI returned an approval from another company.');
        $status=(string)($approval['status']??'pending');$lifecycle=match($status){'pending'=>'approval_required','approved'=>'approved','executing'=>'executing','executed'=>'executed','execution_failed'=>'failed','rejected','expired'=>'blocked',default=>'evaluating'};
        $council=$this->jsonObject($approval['council_result']??null);$confidence=$council['confidence']??null;if(is_numeric($confidence))$confidence=max(0.0,min(1.0,((float)$confidence)/100));else$confidence=null;
        $risk=(string)($approval['risk_level']??'unknown');
        $payload=[
            'status'=>$lifecycle,
            'proposal'=>[
                'id'=>$this->safeId($approval['id']??null),
                'title'=>'Governed action: '.((string)($approval['action']??$subject['action_key']??'action')),
                'summary'=>'TitanAI governance is authoritative for this approval lifecycle.',
                'change_summary'=>[],
            ],
            'risk'=>['level'=>$risk,'status'=>'assessed','reasons'=>$this->stringList($council['findings']??[]),'source_ref'=>'titan-ai'],
            'assurance'=>['status'=>$confidence!==null?'evaluated':'unavailable','level'=>'governance-council','confidence'=>$confidence,'source_ref'=>'titan-ai'],
            'autonomy'=>[],
            'approval'=>[
                'required'=>true,'status'=>$status==='pending'?'pending':$status,'approval_id'=>$this->safeId($approval['id']??null),'source_ref'=>'titan-ai',
                'decided_by'=>$this->safeId($approval['resolved_by']??null),'decided_at'=>$this->safeId($approval['resolved_at']??null),'reason'=>$this->safeText($approval['resolution_note']??null),
            ],
            'execution'=>[
                'status'=>match($status){'executing'=>'executing','executed'=>'succeeded','execution_failed'=>'failed',default=>'not_started'},
                'started_at'=>$this->safeId($approval['execution_started_at']??null),'completed_at'=>null,
                'error_summary'=>$this->safeText($approval['last_execution_error']??null),'source_ref'=>'titan-ai',
            ],
            'receipt'=>null,
            'rollback'=>['available'=>false,'status'=>'unavailable','source_ref'=>'titan-ai'],
            'provenance'=>[
                'authority'=>'titan-ai','source_contract'=>'ApprovalQueue','approval_id'=>$this->safeId($approval['id']??null),
                'decision'=>$this->safeId($council['decision']??null),'trace_id'=>$context->traceId,'correlation_id'=>$context->correlationId,
            ],
        ];
        return new GovernanceStateResult($providerKey,(string)$context->companyId,(string)$context->userId,new GovernanceProviderHealth($providerKey,'healthy','TitanAI approval state is available.'),$payload,['authority'=>'titan-ai','adapter'=>'approval-queue']);
    }

    private function resolveQueue():?object
    {
        try{if(method_exists($this->container,'bound')&&$this->container->bound(self::QUEUE))return $this->container->make(self::QUEUE);}catch(\Throwable){}
        return null;
    }

    private function unavailable(InterfaceContext $context,string $providerKey,string $message):GovernanceStateResult
    {
        return new GovernanceStateResult($providerKey,(string)$context->companyId,(string)$context->userId,new GovernanceProviderHealth($providerKey,'degraded',$message),['status'=>'unavailable','provenance'=>['authority'=>'titan-ai']],['authority'=>'titan-ai','adapter'=>'approval-queue']);
    }

    private function jsonObject(mixed $value):array
    {if(is_array($value)&&!array_is_list($value))return$value;if(!is_string($value)||$value==='')return[];try{$d=json_decode($value,true,32,JSON_THROW_ON_ERROR);return is_array($d)&&!array_is_list($d)?$d:[];}catch(\Throwable){return[];}}
    private function safeId(mixed $value):?string{if(!is_scalar($value))return null;$s=trim((string)$value);return $s!==''&&strlen($s)<=200&&!preg_match('/[\x00-\x1F\x7F]/',$s)?$s:null;}
    private function safeText(mixed $value):?string{if(!is_scalar($value))return null;$s=trim((string)$value);return $s===''?null:substr($s,0,1000);}
    private function stringList(mixed $value):array{if(!is_array($value))return[];$out=[];foreach(array_slice(array_values($value),0,30)as$v){$s=$this->safeText($v);if($s!==null)$out[]=$s;}return$out;}
}
