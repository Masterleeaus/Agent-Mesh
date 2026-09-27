<?php
declare(strict_types=1);
namespace App\Extensions\TitanBuilder\System\Release;
final class BuilderPackageManifestValidator
{
    public function validate(array $manifest): array
    {
        foreach(['schema','name','slug','version','folder','provider'] as $k) if(!isset($manifest[$k])||$manifest[$k]==='') throw new \InvalidArgumentException("Missing manifest field: {$k}");
        if(($manifest['schema']??null)!=='titan-extension-v1') throw new \InvalidArgumentException('Unsupported extension schema.');
        if(($manifest['slug']??null)!=='titan-builder') throw new \InvalidArgumentException('Unexpected Builder slug.');
        $surfaces=$manifest['canonical_surfaces']??[];
        if($surfaces!==['zero','go','hub']) throw new \InvalidArgumentException('Builder canonical surfaces drifted.');
        $compat=$manifest['compatibility']??[];
        if(($compat['onboarding']['surface']??null)!=='zero'||($compat['onboarding']['journey']??null)!=='onboarding') throw new \InvalidArgumentException('Builder onboarding compatibility drifted.');
        return ['valid'=>true,'canonical_surfaces'=>$surfaces,'business_authority'=>false];
    }
}
