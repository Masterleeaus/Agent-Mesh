<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

/** Shared mapping from governed capability outcomes to app workspace lifecycle. */
final class AppExecutionContinuityPolicy
{
    /** @param array<string,mixed> $result */
    public function workspaceState(array $result): string
    {
        $status=strtolower(trim((string)($result['status']??'')));
        if($this->terminal($result)) return 'complete';
        return match($status){
            'pending_approval','prepared' => 'awaiting_decision',
            'executed','offline_deferred' => 'monitoring',
            'unavailable','unauthorized','validation_failed','conflict','failed','blocked_dependency' => 'presenting',
            default => 'presenting',
        };
    }

    /** @param array<string,mixed> $result */
    public function terminal(array $result): bool
    {
        $metadata=is_array($result['metadata']??null)?$result['metadata']:[];
        $data=is_array($result['data']??null)?$result['data']:[];
        if(($metadata['terminal']??false)===true||($data['terminal']??false)===true) return true;
        $state=strtolower(trim((string)($metadata['execution_state']??$data['execution_state']??$data['status']??'')));
        return in_array($state,['complete','completed','succeeded','success','done'],true);
    }

    /** @param array<string,mixed> $result */
    public function receiptId(array $result): ?string
    {
        return $this->boundedString($result,['receipt_id'],['metadata','receipt_id'],['data','receipt_id'],['data','receipt','receipt_id'],['metadata','receipt','receipt_id']);
    }

    /** @param array<string,mixed> $result */
    public function approvalId(array $result): ?string
    {
        return $this->boundedString($result,['approval_id'],['metadata','approval_id'],['data','approval_id']);
    }

    /** @param array<string,mixed> $result */
    public function rollbackCapability(array $result): ?string
    {
        $value=$this->boundedString($result,['rollback_capability'],['metadata','rollback_capability'],['data','rollback_capability'],['data','receipt','rollback_capability']);
        if($value===null) return null;
        return preg_match('/^[a-z0-9][a-z0-9._:-]{2,190}$/',$value)===1?$value:null;
    }

    /** @param array<string,mixed> $payload @param list<string> ...$paths */
    private function boundedString(array $payload,array ...$paths): ?string
    {
        foreach($paths as $path){
            $value=$payload;
            foreach($path as $key){
                if(!is_array($value)||!array_key_exists($key,$value)){ $value=null; break; }
                $value=$value[$key];
            }
            if(is_scalar($value)){
                $value=trim((string)$value);
                if($value!==''&&strlen($value)<=191) return $value;
            }
        }
        return null;
    }
}
