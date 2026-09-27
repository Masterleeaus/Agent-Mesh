<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Host;
final class TitanInstallerManifestContract
{
    public const SCHEMA='titan-extension-v1';
    public const CORE_FIELDS=['schema','slug','folder','provider','version'];
    /** @param array<string,mixed> $manifest @return list<string> */
    public static function validate(array $manifest, bool $packaged=false): array
    {
        $errors=[];
        foreach(self::CORE_FIELDS as $field) if(!isset($manifest[$field]) || $manifest[$field]==='') $errors[]="Missing {$field}";
        if(($manifest['schema']??null)!==self::SCHEMA) $errors[]='Invalid installer schema';
        $allowed=array_merge(self::CORE_FIELDS,['integrity']);
        foreach(array_keys($manifest) as $key) if(!in_array($key,$allowed,true)) $errors[]="Unsupported root manifest field {$key}";
        if($packaged && !isset($manifest['integrity']['files'])) $errors[]='Packaged manifest requires integrity.files';
        return $errors;
    }
}
