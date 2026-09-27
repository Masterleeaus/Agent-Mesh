<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Decision;

final class DecisionPayloadNormalizer
{
    public const MAX_OBSERVATIONS=100;public const MAX_RECOMMENDATIONS=50;public const MAX_SCENARIOS=25;public const MAX_ASSUMPTIONS=100;public const MAX_OUTCOMES=100;public const MAX_CONSEQUENCES=50;

    /** @param array<string,mixed> $payload @return array{observations:list<array<string,mixed>>,recommendations:list<array<string,mixed>>,scenarios:list<array<string,mixed>>,assumptions:list<array<string,mixed>>,diagnostics:array<string,mixed>} */
    public function normalize(array $payload):array
    {
        $diag=['omitted'=>['observations'=>0,'recommendations'=>0,'scenarios'=>0,'assumptions'=>0]];
        $observations=$this->normalizeItems($payload['observations']??[],self::MAX_OBSERVATIONS,'observations',$diag,fn(array $i):?array=>$this->observation($i));
        $recommendations=$this->normalizeItems($payload['recommendations']??[],self::MAX_RECOMMENDATIONS,'recommendations',$diag,fn(array $i):?array=>$this->recommendation($i));
        $scenarios=$this->normalizeItems($payload['scenarios']??[],self::MAX_SCENARIOS,'scenarios',$diag,fn(array $i):?array=>$this->scenario($i));
        $assumptions=$this->normalizeItems($payload['assumptions']??[],self::MAX_ASSUMPTIONS,'assumptions',$diag,fn(array $i):?array=>$this->assumption($i));
        foreach($diag['omitted'] as $k=>$v)if($v===0)unset($diag['omitted'][$k]);
        return compact('observations','recommendations','scenarios','assumptions')+['diagnostics'=>$diag];
    }

    /** @param mixed $raw @param callable(array<string,mixed>):?array<string,mixed> $mapper @param array<string,mixed> $diag @return list<array<string,mixed>> */
    private function normalizeItems(mixed $raw,int $limit,string $kind,array &$diag,callable $mapper):array
    {
        if(!is_array($raw)||!array_is_list($raw)){if($raw!==null&&$raw!==[])$diag['omitted'][$kind]++;return[];}$out=[];
        foreach(array_slice($raw,0,$limit) as $item){if(!is_array($item)||array_is_list($item)){ $diag['omitted'][$kind]++;continue;}$mapped=$mapper($item);if($mapped===null){$diag['omitted'][$kind]++;continue;}$out[]=$mapped;}
        if(count($raw)>$limit)$diag['omitted'][$kind]+=count($raw)-$limit;return$out;
    }
    private function observation(array $i):?array
    {
        $key=$this->key($i['key']??null);$label=$this->text($i['label']??null,160);if($key===null||$label===null)return null;
        return ['key'=>$key,'label'=>$label,'value'=>$this->scalar($i['value']??null),'source_ref'=>$this->text($i['source_ref']??null,200),'observed_at'=>$this->text($i['observed_at']??null,80)];
    }
    private function recommendation(array $i):?array
    {
        $key=$this->key($i['key']??null);$label=$this->text($i['label']??null,160);$summary=$this->text($i['summary']??null,1200);if($key===null||$label===null||$summary===null)return null;
        $confidence=$i['confidence']??null;if($confidence!==null&&(!is_numeric($confidence)||(float)$confidence<0||(float)$confidence>1))$confidence=null;
        return ['key'=>$key,'label'=>$label,'summary'=>$summary,'confidence'=>$confidence===null?null:(float)$confidence,'scenario_ref'=>$this->key($i['scenario_ref']??null),'source_ref'=>$this->text($i['source_ref']??null,200)];
    }
    private function scenario(array $i):?array
    {
        $key=$this->key($i['key']??null);$label=$this->text($i['label']??null,160);if($key===null||$label===null)return null;
        $outcomes=[];$raw=$i['outcomes']??[];if(is_array($raw)&&array_is_list($raw))foreach(array_slice($raw,0,self::MAX_OUTCOMES) as $o){if(!is_array($o)||array_is_list($o))continue;$ok=$this->key($o['key']??null);$ol=$this->text($o['label']??null,160);if($ok===null||$ol===null)continue;$outcomes[]=['key'=>$ok,'label'=>$ol,'value'=>$this->scalar($o['value']??null),'unit'=>$this->text($o['unit']??null,40)];}
        $consequences=[];$rawC=$i['consequences']??[];if(is_array($rawC)&&array_is_list($rawC))foreach(array_slice($rawC,0,self::MAX_CONSEQUENCES) as $c){$text=$this->text($c,500);if($text!==null)$consequences[]=$text;}
        return ['key'=>$key,'label'=>$label,'summary'=>$this->text($i['summary']??null,1200),'recommended'=>($i['recommended']??false)===true,'outcomes'=>$outcomes,'consequences'=>$consequences,'action_ref'=>$this->key($i['action_ref']??null),'source_ref'=>$this->text($i['source_ref']??null,200)];
    }
    private function assumption(array $i):?array
    {
        $key=$this->key($i['key']??null);$label=$this->text($i['label']??null,160);if($key===null||$label===null)return null;
        return ['key'=>$key,'label'=>$label,'value'=>$this->scalar($i['value']??null),'source_ref'=>$this->text($i['source_ref']??null,200),'editable'=>($i['editable']??false)===true];
    }
    private function key(mixed $v):?string{return is_string($v)&&preg_match('/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/',$v)===1?$v:null;}
    private function text(mixed $v,int $max):?string{if($v===null)return null;if(!is_string($v))return null;$v=trim(strip_tags($v));return $v!==''&&strlen($v)<=$max?$v:null;}
    private function scalar(mixed $v):mixed{return is_string($v)?$this->text($v,1000):(is_int($v)||is_float($v)||is_bool($v)||$v===null?$v:null);}
}
