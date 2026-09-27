<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System;

use App\Extensions\InteractionEngine\System\Capabilities\{CapabilityExecutionContext,CapabilityRouter};
use App\Extensions\InteractionEngine\System\Contracts\{CapabilityIntentGatewayInterface,GovernedOperationLedgerInterface};

final class CapabilityIntentGateway implements CapabilityIntentGatewayInterface
{
    public function __construct(private readonly CapabilityRouter $router, private readonly GovernedOperationLedgerInterface $operations) {}

    public function dispatch(string $capability, array $payload, array $trustedContext): array
    {
        $capability=trim($capability);
        if(!preg_match('/^[a-z0-9][a-z0-9._:-]{2,190}$/',$capability)) {
            throw new \InvalidArgumentException('Capability intent is invalid.');
        }
        $companyId=trim((string)($trustedContext['company_id']??''));
        $actorId=trim((string)($trustedContext['actor_id']??$trustedContext['user_id']??''));
        if($companyId===''||$actorId==='') {
            throw new \InvalidArgumentException('Trusted company_id and actor_id are required.');
        }
        $surface=$this->canonicalSurface((string)($trustedContext['source_surface']??$trustedContext['surface']??''));
        $correlationId=trim((string)($trustedContext['correlation_id']??''));
        if($correlationId==='') {
            $correlationId='titan-intent:'.hash('sha256',$companyId.'|'.$actorId.'|'.$capability.'|'.json_encode($payload,JSON_UNESCAPED_SLASHES));
        }

        $context=new CapabilityExecutionContext(
            companyId:$companyId,
            actorId:$actorId,
            actorType:(string)($trustedContext['actor_type']??'user'),
            roles:array_values(array_map('strval',(array)($trustedContext['roles']??[]))),
            scopes:array_values(array_map('strval',(array)($trustedContext['scopes']??$trustedContext['delegated_scopes']??[]))),
            sourceSurface:$surface,
            correlationId:$correlationId,
            interactionId:isset($trustedContext['interaction_id'])?(string)$trustedContext['interaction_id']:null,
            wizardId:isset($trustedContext['wizard_id'])?(string)$trustedContext['wizard_id']:null,
            sessionId:isset($trustedContext['session_id'])?(string)$trustedContext['session_id']:null,
            deviceId:isset($trustedContext['device_id'])?(string)$trustedContext['device_id']:null,
            idempotencyKey:isset($trustedContext['idempotency_key'])?(string)$trustedContext['idempotency_key']:null,
            approvalEvidence:(array)($trustedContext['approval_evidence']??[]),
        );

        $payload['_context']=array_replace((array)($payload['_context']??[]),$context->toProviderContext());
        $payload['company_id']=$companyId;
        if($context->idempotencyKey!==null) $payload['idempotency_key']=$context->idempotencyKey;

        $result=$this->router->execute($capability,$payload,$context)->toArray();
        $result['executed']=($result['status']??null)==='executed';
        $result['authority']='interaction-engine-governed';

        $operationId=strlen($correlationId)<=191?$correlationId:'titan-op:'.hash('sha256',$correlationId);
        $this->operations->record($companyId,$operationId,[
            'actor_id'=>$actorId,
            'source_surface'=>$surface,
            'capability'=>$capability,
            'status'=>(string)($result['status']??'unknown'),
            'idempotency_key'=>$context->idempotencyKey,
            'correlation_id'=>$correlationId,
            'receipt_id'=>$this->scalar($result,'receipt_id'),
            'approval_id'=>$this->scalar($result,'approval_id'),
            'rollback_capability'=>$this->scalar($result,'rollback_capability'),
            'metadata'=>is_array($result['metadata']??null)?$result['metadata']:[],
            'data'=>is_array($result['data']??null)?$result['data']:[],
            'result'=>$result,
        ]);
        $result['operation_id']=$operationId;
        return $result;
    }

    private function scalar(array $result,string $key): ?string
    {
        $metadata=is_array($result['metadata']??null)?$result['metadata']:[];
        $data=is_array($result['data']??null)?$result['data']:[];
        foreach([$result[$key]??null,$metadata[$key]??null,$data[$key]??null] as $v){
            if(is_scalar($v)&&trim((string)$v)!=='')return trim((string)$v);
        }
        return null;
    }

    private function canonicalSurface(string $surface): string
    {
        return match(strtolower(trim($surface))){
            'bos','command','owner','manager','business','onboarding','setup'=>'zero',
            'field','worker','titan_go','titan-go'=>'go',
            'customer','titan_hub','titan-hub'=>'hub',
            'zero','go','hub'=>strtolower(trim($surface)),
            default=>'api',
        };
    }
}
