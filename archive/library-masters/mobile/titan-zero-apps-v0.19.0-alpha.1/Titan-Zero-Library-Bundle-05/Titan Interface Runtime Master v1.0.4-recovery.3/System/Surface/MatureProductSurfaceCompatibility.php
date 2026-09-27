<?php
declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Surface;
final class MatureProductSurfaceCompatibility
{
    public function resolve(string $surface,?string $journey=null): string
    {
        $surface=strtolower(trim($surface));
        if($surface==='zero') return $journey==='onboarding'?'onboarding':'command';
        if(in_array($surface,['go','hub'],true)) return $surface;
        throw new \InvalidArgumentException('Unsupported canonical app surface for mature Interface Runtime compatibility.');
    }
}
