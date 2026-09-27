<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualFallbackPlanner,VisualEnvironment,VisualPreferences};
final class DeterministicVisualFallbackPlanner implements VisualFallbackPlanner {
    public function fallback(array $request, VisualEnvironment $environment, VisualPreferences $preferences, array $negotiation): array {
        if($preferences->reducedMotion) return ['treatment'=>'semantic-static','reason'=>'reduced-motion','degraded'=>true];
        if($environment->lowPower) return ['treatment'=>'low-power-static','reason'=>'low-power','degraded'=>true];
        if(($negotiation['missing']??[])!==[]) return ['treatment'=>'semantic-static','reason'=>'missing-capability','degraded'=>true];
        if($environment->connectivity==='offline' && in_array('video',$negotiation['required']??[],true)) return ['treatment'=>'offline-poster','reason'=>'offline-media','degraded'=>true];
        $declared=$request['fallback']['treatment']??$request['reducedMotionFallback']['treatment']??'none';
        return ['treatment'=>(string)$declared,'reason'=>'none','degraded'=>false];
    }
}
