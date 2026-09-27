<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Release;
final class VisualRuntimePackageManifestValidator
{
    public function validate(array $manifest): array {
        foreach(['schema','name','slug','version','folder','provider'] as $k) if(!isset($manifest[$k])||$manifest[$k]==='') throw new \InvalidArgumentException("Missing manifest field: {$k}");
        if(($manifest['schema']??null)!=='titan-extension-v1') throw new \InvalidArgumentException('Unsupported extension schema.');
        if(($manifest['slug']??null)!=='titan-visual-runtime') throw new \InvalidArgumentException('Unexpected Visual Runtime slug.');
        $surfaces=$manifest['compatibility']['surfaces']??[];
        if($surfaces!==['zero','go','hub']) throw new \InvalidArgumentException('Visual Runtime canonical surfaces drifted.');
        if(($manifest['compatibility']['visual_authority']??true)!==false||($manifest['compatibility']['business_authority']??true)!==false) throw new \InvalidArgumentException('Visual Runtime authority boundary drifted.');
        return ['valid'=>true,'canonical_surfaces'=>$surfaces,'business_authority'=>false];
    }
}
