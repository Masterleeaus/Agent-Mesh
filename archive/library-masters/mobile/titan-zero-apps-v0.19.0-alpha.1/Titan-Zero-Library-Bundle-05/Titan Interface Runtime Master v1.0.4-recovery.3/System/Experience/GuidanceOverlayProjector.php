<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Experience;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\GuidanceOverlayProjectorContract;

final class GuidanceOverlayProjector implements GuidanceOverlayProjectorContract
{
    private const PLACEMENTS=['top','bottom','left','right','center'];

    /** @param list<array<string,mixed>> $steps */
    public function project(InterfaceContext $context, array $steps): GuidanceOverlaySnapshot
    {
        $safe=[];$omitted=0;
        foreach(array_slice($steps,0,50) as $step){
            if(!is_array($step)){ $omitted++; continue; }
            $normalized=$this->normalize($step,$context);
            if($normalized===null){$omitted++;continue;}
            $safe[]=$normalized;
        }
        $omitted += max(0,count($steps)-50);
        return new GuidanceOverlaySnapshot($context->productSurface,$safe,$omitted);
    }

    /** @param array<string,mixed> $step @return array<string,mixed>|null */
    private function normalize(array $step, InterfaceContext $context): ?array
    {
        $key=$step['key']??null;$title=$step['title']??null;$description=$step['description']??null;
        $target=$step['target_ref']??null;$placement=$step['placement']??'bottom';$action=$step['action_ref']??null;
        if(!is_string($key)||preg_match('/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/',$key)!==1) return null;
        if(!is_string($title)||trim($title)===''||strlen($title)>160||strip_tags($title)!==$title) return null;
        if(!is_string($description)||strlen($description)>1000||strip_tags($description)!==$description) return null;
        if(!is_string($target)||preg_match('/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/',$target)!==1) return null;
        if(!is_string($placement)||!in_array($placement,self::PLACEMENTS,true)) return null;
        if($action!==null&&(!is_string($action)||preg_match('/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/',$action)!==1)) return null;
        if(isset($step['product_surfaces'])){
            if(!is_array($step['product_surfaces'])||!in_array($context->productSurface,$step['product_surfaces'],true)) return null;
        }
        return ['key'=>$key,'title'=>$title,'description'=>$description,'target_ref'=>$target,'placement'=>$placement,'action_ref'=>$action,'executable'=>false];
    }
}
