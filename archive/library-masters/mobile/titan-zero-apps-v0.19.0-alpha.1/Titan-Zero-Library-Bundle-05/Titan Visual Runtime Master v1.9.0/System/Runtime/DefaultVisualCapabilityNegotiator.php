<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualCapabilityNegotiator,VisualCapabilityRegistry,VisualEnvironment};
final class DefaultVisualCapabilityNegotiator implements VisualCapabilityNegotiator {
    public function __construct(private readonly VisualCapabilityRegistry $registry) {}
    public function negotiate(array $requirements, VisualEnvironment $environment): array {
        $required=[];
        foreach($requirements as $requirement){
            if(!is_string($requirement) || $requirement==='') continue;
            if(!preg_match('/^[a-z0-9][a-z0-9._-]{0,63}$/',$requirement)) throw new \InvalidArgumentException('Invalid visual capability identifier.');
            $required[]=$requirement;
        }
        $required=array_values(array_unique($required));
        sort($required,SORT_STRING);
        $available=[];$missing=[];
        foreach($required as $capability){ if($this->registry->supports($capability,$environment)){ $available[]=$capability; } else { $missing[]=$capability; } }
        return ['required'=>$required,'available'=>$available,'missing'=>$missing,'strategy'=>$missing===[]?'preferred':'fallback'];
    }
}
