<?php
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualStateTransitionPlanner;
final class DeterministicVisualStateTransitionPlanner implements VisualStateTransitionPlanner
{
    private const STATES=['idle','loading','streaming','success','warning','error','empty'];
    public function plan(string $from,string $to,array $environment=[]): array
    {
        if(!in_array($from,self::STATES,true)||!in_array($to,self::STATES,true)) throw new \InvalidArgumentException('Unsupported visual state');
        $reduced=(bool)($environment['reducedMotion']??false); $low=(bool)($environment['lowPower']??false);
        $motion=($reduced||$low||$from===$to)?'none':'state-change';
        return ['from'=>$from,'to'=>$to,'motionPreset'=>$motion,'durationMs'=>$motion==='none'?0:180,'businessMeaningChanged'=>false];
    }
}
