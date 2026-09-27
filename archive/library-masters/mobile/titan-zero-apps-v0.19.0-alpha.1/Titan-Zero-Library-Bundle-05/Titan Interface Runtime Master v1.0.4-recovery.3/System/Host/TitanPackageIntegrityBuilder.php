<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Host;
use FilesystemIterator; use RecursiveDirectoryIterator; use RecursiveIteratorIterator;
final class TitanPackageIntegrityBuilder
{
    /** @return array<string,string> */
    public static function build(string $root): array
    {
        $root=rtrim(realpath($root) ?: $root,DIRECTORY_SEPARATOR); $files=[];
        $it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS));
        foreach($it as $file){ if(!$file->isFile()||$file->isLink())continue; $rel=str_replace('\\','/',substr($file->getPathname(),strlen($root)+1)); if($rel==='extension.json')continue; $files[$rel]=hash_file('sha256',$file->getPathname()); }
        ksort($files,SORT_STRING); return $files;
    }
}
