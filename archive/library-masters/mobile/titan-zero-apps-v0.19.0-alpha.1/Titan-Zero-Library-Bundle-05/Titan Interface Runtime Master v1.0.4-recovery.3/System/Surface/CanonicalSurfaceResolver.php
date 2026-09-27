<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Surface;

use App\Extensions\TitanInterfaceRuntime\System\Value\SurfaceResolution;
final class CanonicalSurfaceResolver
{
    private const ALIASES=['bos'=>'zero','command'=>'zero','owner'=>'zero','manager'=>'zero','business'=>'zero','field'=>'go','worker'=>'go','customer'=>'hub'];
    public function resolve(string $surface, ?string $journey=null): SurfaceResolution
    {
        $raw=strtolower(trim($surface));
        if($raw==='onboarding') return new SurfaceResolution('zero','onboarding','onboarding');
        $canonical=self::ALIASES[$raw]??$raw;
        if(!in_array($canonical,['zero','go','hub'],true)) throw new \InvalidArgumentException('Unsupported app surface: '.$surface);
        return new SurfaceResolution($canonical,$journey,$canonical!==$raw?$raw:null);
    }
}
