<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualCapabilityDegradationPlanner;
final class DeterministicVisualCapabilityDegradationPlanner implements VisualCapabilityDegradationPlanner
{
    public function plan(array $preferred,array $available): array {
        $available=array_values(array_unique(array_filter($available,'is_string')));
        foreach($preferred as $candidate){
            if(is_string($candidate) && in_array($candidate,$available,true)) {
                return ['selected'=>$candidate,'degraded'=>$candidate!==($preferred[0]??null),'deterministic'=>true];
            }
        }
        return ['selected'=>'static','degraded'=>true,'deterministic'=>true];
    }
}
