<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\SpatialAssuranceGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialAutonomyGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialCommandBusGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialRewindRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialRiskGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialDecisionReceipt;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use Throwable;

final class GovernedSpatialCapabilityExecutor
{
    public function __construct(
        private readonly SpatialCapabilityPolicyCatalog $policies,
        private readonly SpatialRiskGateway $risk,
        private readonly SpatialAssuranceGateway $assurance,
        private readonly SpatialAutonomyGateway $autonomy,
        private readonly SpatialCommandBusGateway $commandBus,
        private readonly SpatialSignalPublisher $signals,
        private readonly SpatialRewindRecorder $rewind,
        private readonly SpatialExecutionContextFactory $contexts,
        private readonly ?SpatialExecutionContextStore $executionStore = null,
    ) {}

    public function execute(string $capabilityId,array $input,callable $operation,array $evidence=[]): array
    {
        try {
            $context=$this->contexts->fromInput($capabilityId,$input);
        } catch (MapsIntelligenceException $e) {
            return ['ok'=>false,'error'=>$e->toSafeArray()];
        }
        $policy=$this->policies->policy($capabilityId);
        $offline=$this->offlineDecision($context,$policy);
        if($offline!==null) return $this->denied($context,$policy,$offline['code'],$offline['reason_codes'],null,null,null);

        $risk=$this->risk->evaluate($context,$policy,$input,$evidence);
        $assurance=$this->assurance->evaluate($context,$policy,$input,$evidence);
        $autonomy=$this->autonomy->decide($context,$policy,$input,$evidence);

        if(($risk['available']??false)===true && ($risk['allowed']??null)===false) {
            return $this->denied($context,$policy,'MAPS_GOVERNANCE_DENIED',array_values($risk['reason_codes']??['RISK_DENIED']),$risk,$assurance,$autonomy);
        }
        if(($autonomy['available']??false)===true && ($autonomy['allowed']??null)===false && $context->origin!=='human') {
            return $this->denied($context,$policy,'MAPS_GOVERNANCE_DENIED',array_values($autonomy['reason_codes']??['AUTONOMY_DENIED']),$risk,$assurance,$autonomy);
        }

        $mutation=(string)($policy['mutation_class']??'read_only');
        if($context->origin!=='human' && in_array($mutation,['maps_mutation','authoritative_mutation'],true)) {
            if(($risk['available']??false)!==true) return $this->denied($context,$policy,'MAPS_RISK_REQUIRED',['RISK_ENGINE_REQUIRED_FOR_AI_MUTATION'],$risk,$assurance,$autonomy);
            if(($autonomy['available']??false)!==true) return $this->denied($context,$policy,'MAPS_AUTONOMY_REQUIRED',['AUTONOMY_ENGINE_REQUIRED_FOR_AI_MUTATION'],$risk,$assurance,$autonomy);
        }

        if($mutation==='authoritative_mutation' && $context->origin!=='human') {
            if(!$this->commandBus->available()) return $this->denied($context,$policy,'MAPS_COMMAND_BUS_REQUIRED',['COMMAND_BUS_REQUIRED_FOR_AUTHORITATIVE_MUTATION'],$risk,$assurance,$autonomy);
            $idempotency=$this->idempotencyKey($context,$input);
            $command=$this->commandBus->execute($context,$capabilityId,$this->stripExecutionMetadata($input),$idempotency);
            if(($command['ok']??false)!==true) return $this->denied($context,$policy,(string)($command['error']['code']??'MAPS_COMMAND_FAILED'),['COMMAND_EXECUTION_FAILED'],$risk,$assurance,$autonomy,(string)($command['receipt_id']??''));
            return $this->completed($context,$policy,$command['data']??null,$risk,$assurance,$autonomy,$evidence,(string)($command['receipt_id']??''));
        }

        $this->executionStore?->set($context);
        try {
            $data=$operation($context,$policy);
            return $this->completed($context,$policy,$data,$risk,$assurance,$autonomy,$evidence,null);
        } catch (MapsIntelligenceException $e) {
            return $this->failed($context,$policy,$e->errorCode(),[$e->errorCode()],$risk,$assurance,$autonomy,$e->toSafeArray());
        } catch (Throwable $e) {
            return $this->failed($context,$policy,'MAPS_CAPABILITY_FAILED',['CAPABILITY_EXECUTION_FAILED'],$risk,$assurance,$autonomy,['code'=>'MAPS_CAPABILITY_FAILED','message'=>'The spatial capability could not be completed.']);
        } finally {
            $this->executionStore?->clear();
        }
    }

    private function offlineDecision(SpatialExecutionContext $context,array $policy): ?array
    {
        if($context->origin!=='offline_sync') return null;
        return match((string)($policy['offline_policy']??'OFFLINE_BLOCKED')) {
            'OFFLINE_EXECUTE'=>null,
            'OFFLINE_PREPARE_ONLY'=>['code'=>'MAPS_OFFLINE_PREPARE_ONLY','reason_codes'=>['OFFLINE_POLICY_PREPARE_ONLY']],
            default=>['code'=>'MAPS_OFFLINE_BLOCKED','reason_codes'=>['OFFLINE_POLICY_BLOCKED']],
        };
    }

    private function completed(SpatialExecutionContext $context,array $policy,mixed $data,array $risk,array $assurance,array $autonomy,array $evidence,?string $commandReceipt): array
    {
        $receipt=$this->receipt($context,'completed',[], $evidence,$risk,$assurance,$autonomy,$commandReceipt,'Capability completed under the declared Maps governance policy.');
        $rewind=$this->rewind->record($receipt);
        $receipt=$this->withRewind($receipt,$rewind);
        $this->signals->publish('maps.capability.executed',$context,['receipt_id'=>$receipt->receiptId,'risk_profile'=>$policy['risk_profile']??null,'mutation_class'=>$policy['mutation_class']??null]);
        return ['ok'=>true,'data'=>$data,'governance_receipt'=>$receipt->toArray()];
    }

    private function denied(SpatialExecutionContext $context,array $policy,string $code,array $reasonCodes,?array $risk,?array $assurance,?array $autonomy,?string $commandReceipt=null): array
    {
        $receipt=$this->receipt($context,'denied',$reasonCodes,[],$risk??[],$assurance??[],$autonomy??[],$commandReceipt,'Capability was denied by the declared governance/offline execution policy.');
        $rewind=$this->rewind->record($receipt);$receipt=$this->withRewind($receipt,$rewind);
        $this->signals->publish('maps.capability.denied',$context,['receipt_id'=>$receipt->receiptId,'code'=>$code,'reason_codes'=>$reasonCodes]);
        return ['ok'=>false,'error'=>['code'=>$code,'message'=>'The spatial capability was not authorised for execution.','reason_codes'=>$reasonCodes],'governance_receipt'=>$receipt->toArray()];
    }

    private function failed(SpatialExecutionContext $context,array $policy,string $code,array $reasonCodes,array $risk,array $assurance,array $autonomy,array $error): array
    {
        $receipt=$this->receipt($context,'failed',$reasonCodes,[],$risk,$assurance,$autonomy,null,'Capability execution failed; no success is implied.');
        $rewind=$this->rewind->record($receipt);$receipt=$this->withRewind($receipt,$rewind);
        $this->signals->publish('maps.capability.failed',$context,['receipt_id'=>$receipt->receiptId,'code'=>$code]);
        return ['ok'=>false,'error'=>$error,'governance_receipt'=>$receipt->toArray()];
    }

    private function receipt(SpatialExecutionContext $context,string $status,array $reasonCodes,array $evidence,array $risk,array $assurance,array $autonomy,?string $commandReceipt,string $summary): SpatialDecisionReceipt
    {
        return new SpatialDecisionReceipt(
            receiptId:'maps-receipt-'.bin2hex(random_bytes(16)),traceId:$context->traceId,correlationId:$context->correlationId,causationId:$context->causationId,
            companyId:$context->companyId,capabilityId:$context->capabilityId,status:$status,reasonCodes:$reasonCodes,
            evidenceReferences:$this->evidenceReferences($evidence),riskReference:$this->nullableString($risk['reference']??null),assuranceReference:$this->nullableString($assurance['reference']??null),autonomyReference:$this->nullableString($autonomy['reference']??null),commandReceiptReference:$this->nullableString($commandReceipt),rationaleSummary:$summary,
        );
    }

    private function withRewind(SpatialDecisionReceipt $receipt,?string $rewind): SpatialDecisionReceipt
    {
        return new SpatialDecisionReceipt(
            $receipt->receiptId,$receipt->traceId,$receipt->correlationId,$receipt->causationId,$receipt->companyId,$receipt->capabilityId,$receipt->status,$receipt->reasonCodes,$receipt->evidenceReferences,$receipt->riskReference,$receipt->assuranceReference,$receipt->autonomyReference,$receipt->commandReceiptReference,$this->nullableString($rewind),$receipt->rationaleSummary,$receipt->createdAt,
        );
    }

    private function evidenceReferences(array $evidence): array
    {
        $refs=[];foreach($evidence as $key=>$value){if(is_scalar($value)&&$value!==''&&$value!==null)$refs[(string)$key]=(string)$value;}return $refs;
    }
    private function nullableString(mixed $v): ?string { if(!is_scalar($v))return null;$s=trim((string)$v);return $s===''?null:$s; }
    private function idempotencyKey(SpatialExecutionContext $context,array $input): string { return 'maps:'.hash('sha256',$context->companyId.'|'.$context->capabilityId.'|'.$context->correlationId.'|'.json_encode($this->stripExecutionMetadata($input),JSON_UNESCAPED_SLASHES)); }
    private function stripExecutionMetadata(array $input): array { foreach(['trace_id','correlation_id','causation_id','execution_origin','agent_id','conversation_id'] as $k)unset($input[$k]);return $input; }
}
