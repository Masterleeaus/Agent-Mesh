<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Governance;

use App\Extensions\TitanInterfaceRuntime\System\Receipts\InterfaceReceipt;

final class GovernancePayloadNormalizer
{
    private const STATUSES = ['proposed','evaluating','approval_required','approved','queued','executing','executed','failed','blocked','rollback_available','rollback_pending','rolled_back','rollback_failed','recovery_required','unavailable'];
    private const RISK_LEVELS = ['none','low','medium','high','critical','unknown'];

    /** @param array<string,mixed> $payload @return array<string,mixed> */
    public function normalize(array $payload): array
    {
        $status = $this->token($payload['status'] ?? 'unavailable', self::STATUSES, 'unavailable');
        $proposal = $this->proposal($payload['proposal'] ?? null);
        $risk = $this->risk($payload['risk'] ?? null);
        $assurance = $this->boundedMap($payload['assurance'] ?? null, ['status','level','source_ref','assessed_at'], ['confidence']);
        $autonomy = $this->boundedMap($payload['autonomy'] ?? null, ['level','status','policy_ref','source_ref'], []);
        $approval = $this->approval($payload['approval'] ?? null);
        $execution = $this->boundedMap($payload['execution'] ?? null, ['status','started_at','completed_at','error_code','error_summary','source_ref'], []);
        $rollback = $this->rollback($payload['rollback'] ?? null);
        $receipt = $this->receipt($payload['receipt'] ?? null, $rollback);
        $provenance = $this->safeValue($payload['provenance'] ?? [], 0);
        if (! is_array($provenance)) $provenance = [];
        $handoffs = $this->handoffs($payload['handoffs'] ?? null);

        return compact('status','proposal','risk','assurance','autonomy','approval','execution','receipt','rollback','provenance','handoffs');
    }

    /** @return array<string,mixed> */
    private function proposal(mixed $value): array
    {
        if (! is_array($value) || array_is_list($value)) return [];
        return [
            'id'=>$this->string($value['id'] ?? null,160),
            'title'=>$this->string($value['title'] ?? null,200),
            'summary'=>$this->string($value['summary'] ?? null,1000),
            'change_summary'=>$this->stringList($value['change_summary'] ?? null,50,500),
        ];
    }

    /** @return array<string,mixed> */
    private function risk(mixed $value): array
    {
        if (! is_array($value) || array_is_list($value)) return [];
        $level = strtolower((string)($value['level'] ?? 'unknown'));
        $level = match ($level) { 'green'=>'low', 'amber'=>'medium', 'red'=>'high', default=>$level };
        if (! in_array($level,self::RISK_LEVELS,true)) $level='unknown';
        $score = $value['score'] ?? null;
        if (! is_int($score) && ! is_float($score)) $score=null;
        if ($score !== null) $score=max(0.0,min(1.0,(float)$score));
        return [
            'level'=>$level,
            'status'=>$this->string($value['status'] ?? null,80),
            'score'=>$score,
            'reasons'=>$this->stringList($value['reasons'] ?? null,30,500),
            'source_ref'=>$this->string($value['source_ref'] ?? null,200),
            'assessed_at'=>$this->string($value['assessed_at'] ?? null,80),
        ];
    }

    /** @return array<string,mixed> */
    private function approval(mixed $value): array
    {
        if (! is_array($value) || array_is_list($value)) return [];
        return [
            'required'=>($value['required'] ?? false)===true,
            'status'=>$this->string($value['status'] ?? null,80),
            'approval_id'=>$this->string($value['approval_id'] ?? null,160),
            'source_ref'=>$this->string($value['source_ref'] ?? null,200),
            'decided_by'=>$this->string($value['decided_by'] ?? null,160),
            'decided_at'=>$this->string($value['decided_at'] ?? null,80),
            'reason'=>$this->string($value['reason'] ?? null,1000),
        ];
    }

    /** @return array<string,mixed> */
    private function rollback(mixed $value): array
    {
        if (! is_array($value) || array_is_list($value)) return ['available'=>false,'status'=>'unavailable'];
        return [
            'available'=>($value['available'] ?? false)===true,
            'status'=>$this->string($value['status'] ?? null,80) ?: (($value['available'] ?? false)===true?'available':'unavailable'),
            'source_ref'=>$this->string($value['source_ref'] ?? null,200),
            'reason'=>$this->string($value['reason'] ?? null,1000),
            'capability_ref'=>$this->string($value['capability_ref'] ?? null,200),
            'interaction_ref'=>$this->string($value['interaction_ref'] ?? null,200),
            'compensation_ref'=>$this->string($value['compensation_ref'] ?? null,200),
        ];
    }

    private function receipt(mixed $value, array $rollback): ?InterfaceReceipt
    {
        if (! is_array($value) || array_is_list($value)) return null;
        $id=$this->string($value['receipt_id'] ?? null,160);$status=$this->string($value['status'] ?? null,80);$authority=$this->string($value['source_authority'] ?? null,160);
        if ($id===null||$status===null||$authority===null) return null;
        $changeSummary=$this->stringList($value['change_summary'] ?? null,100,500);
        $rollbackAvailable=($value['rollback_available']??false)===true||($rollback['available']??false)===true;
        $rollbackCapability=$this->string($value['rollback_capability'] ?? null,200) ?? ($rollback['capability_ref']??null);
        if ($rollbackAvailable && $rollbackCapability===null) $rollbackCapability='authoritative-receipt-rollback';
        $metadata=['change_summary'=>$changeSummary,'rollback_available'=>$rollbackAvailable];
        return new InterfaceReceipt(
            receiptId:$id,status:$status,sourceAuthority:$authority,
            correlationId:$this->string($value['correlation_id']??null,128),
            causationId:$this->string($value['causation_id']??null,128),
            rollbackCapability:$rollbackCapability,
            metadata:$metadata,
        );
    }

    /** @return list<array<string,mixed>> */
    private function handoffs(mixed $value): array
    {
        if (! is_array($value) || ! array_is_list($value)) return [];
        $out=[];
        foreach (array_slice($value,0,20) as $item) {
            if (! is_array($item) || array_is_list($item)) continue;
            $operation=$this->string($item['operation']??null,40);if($operation===null)continue;
            $kind=$this->string($item['kind']??null,40);$ref=$this->string($item['ref']??null,200);
            $method=strtoupper((string)($item['method']??'POST'));if(!in_array($method,['POST'],true))continue;
            $out[]=['operation'=>$operation,'kind'=>$kind,'ref'=>$ref,'method'=>$method,'parameters'=>$this->scalarMap($item['parameters']??[])];
        }
        return $out;
    }

    /** @param list<string> $stringKeys @param list<string> $numberKeys @return array<string,mixed> */
    private function boundedMap(mixed $value,array $stringKeys,array $numberKeys):array
    {
        if(!is_array($value)||array_is_list($value))return[];$out=[];
        foreach($stringKeys as $key)$out[$key]=$this->string($value[$key]??null,$key==='error_summary'?1000:200);
        foreach($numberKeys as $key){$n=$value[$key]??null;$out[$key]=(is_int($n)||is_float($n))?max(0.0,min(1.0,(float)$n)):null;}
        return $out;
    }

    private function token(mixed $value,array $allowed,string $fallback):string
    { $v=is_string($value)?strtolower($value):'';return in_array($v,$allowed,true)?$v:$fallback; }

    private function string(mixed $value,int $max):?string
    { if(!is_string($value))return null;$value=trim($value);if($value===''||strlen($value)>$max||preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/',$value))return null;return $value; }

    /** @return list<string> */
    private function stringList(mixed $value,int $maxItems,int $maxLen):array
    { if(!is_array($value)||!array_is_list($value))return[];$out=[];foreach(array_slice($value,0,$maxItems)as$v){$s=$this->string($v,$maxLen);if($s!==null)$out[]=$s;}return$out; }

    /** @return array<string,scalar|null> */
    private function scalarMap(mixed $value):array
    { if(!is_array($value)||array_is_list($value))return[];$out=[];foreach(array_slice($value,0,30,true)as$k=>$v)if(is_string($k)&&(is_scalar($v)||$v===null))$out[$k]=$v;return$out; }

    private function safeValue(mixed $value,int $depth):mixed
    {
        if($depth>4)return null;
        if(is_scalar($value)||$value===null)return is_string($value)&&strlen($value)>1000?substr($value,0,1000):$value;
        if(!is_array($value))return null;
        $out=[];$count=0;
        foreach($value as$k=>$v){if(++$count>100)break;if(!is_int($k)&&!is_string($k))continue;$out[$k]=$this->safeValue($v,$depth+1);}return$out;
    }
}
