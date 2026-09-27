<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Configuration;

final class ConfigurationPayloadNormalizer
{
    private const STATUSES = ['draft','preview','validation_pending','invalid','validated','publishing','published','rollback_available','rollback_pending','rolled_back','unavailable'];
    private const VALIDATION_STATUSES = ['unknown','pending','valid','invalid','warning'];
    private const OPERATIONS = ['preview','validate','publish','rollback'];

    /** @param array<string,mixed> $payload @return array<string,mixed> */
    public function normalize(array $payload): array
    {
        $status=is_string($payload['status']??null)&&in_array($payload['status'],self::STATUSES,true)?$payload['status']:'unavailable';
        $current=$this->version($payload['current_version']??null);
        $published=$this->version($payload['published_version']??null);
        $preview=$this->preview($payload['preview']??null);
        $validation=$this->validation($payload['validation']??null);
        $history=[];
        foreach(array_slice(is_array($payload['history']??null)?$payload['history']:[],0,100) as $entry){$normalized=$this->version($entry);if($normalized!==null)$history[]=$normalized;}
        $rollback=$this->rollback($payload['rollback']??null);
        $actionRefs=[];
        if(is_array($payload['action_refs']??null)&&!array_is_list($payload['action_refs'])){
            foreach(self::OPERATIONS as $operation){$value=$payload['action_refs'][$operation]??null;if(is_string($value)&&preg_match('/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/',$value)===1)$actionRefs[$operation]=$value;}
        }
        return ['status'=>$status,'current_version'=>$current,'published_version'=>$published,'preview'=>$preview,'validation'=>$validation,'history'=>$history,'rollback'=>$rollback,'action_refs'=>$actionRefs];
    }

    /** @return array<string,mixed>|null */
    private function version(mixed $value): ?array
    {
        if(!is_array($value)||array_is_list($value))return null;
        $id=$this->string($value['id']??null,160); if($id===null)return null;
        $out=['id'=>$id];
        foreach(['label'=>200,'state'=>80,'created_at'=>80,'published_at'=>80,'actor_ref'=>160,'summary'=>500] as $key=>$max){$v=$this->string($value[$key]??null,$max);if($v!==null)$out[$key]=$v;}
        if(array_key_exists('current',$value))$out['current']=($value['current']??false)===true;
        if(array_key_exists('published',$value))$out['published']=($value['published']??false)===true;
        return $out;
    }

    /** @return array<string,mixed> */
    private function preview(mixed $value): array
    {
        if(!is_array($value)||array_is_list($value))return ['available'=>false];
        $out=['available'=>($value['available']??false)===true];
        foreach(['source_ref'=>200,'label'=>200,'expires_at'=>80,'status'=>80] as $key=>$max){$v=$this->string($value[$key]??null,$max);if($v!==null)$out[$key]=$v;}
        return $out;
    }

    /** @return array<string,mixed> */
    private function validation(mixed $value): array
    {
        if(!is_array($value)||array_is_list($value))return ['status'=>'unknown','errors'=>[],'warnings'=>[]];
        $status=is_string($value['status']??null)&&in_array($value['status'],self::VALIDATION_STATUSES,true)?$value['status']:'unknown';
        return ['status'=>$status,'errors'=>$this->messages($value['errors']??null,50),'warnings'=>$this->messages($value['warnings']??null,100),'source_ref'=>$this->string($value['source_ref']??null,200)];
    }

    /** @return array<string,mixed> */
    private function rollback(mixed $value): array
    {
        if(!is_array($value)||array_is_list($value))return ['available'=>false];
        $out=['available'=>($value['available']??false)===true];
        foreach(['target_version_id'=>160,'label'=>200,'status'=>80,'source_ref'=>200] as $key=>$max){$v=$this->string($value[$key]??null,$max);if($v!==null)$out[$key]=$v;}
        return $out;
    }

    /** @return list<string> */
    private function messages(mixed $value,int $maxItems): array
    {
        if(!is_array($value)||!array_is_list($value))return [];$out=[];
        foreach(array_slice($value,0,$maxItems) as $item){$v=$this->string($item,500);if($v!==null)$out[]=$v;}return $out;
    }

    private function string(mixed $value,int $max): ?string
    {
        if(!is_string($value))return null;$value=trim($value);if($value===''||strlen($value)>$max||preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/',$value))return null;return $value;
    }
}
