<?php
declare(strict_types=1);
namespace App\Extensions\TitanBuilder\System\Contracts;

final class VisualContractEvolutionPolicy
{
    public const CURRENT='1.1';
    public const SUPPORTED_MAJORS=[1];

    public static function normalize(string $version): string
    {
        if(!preg_match('/^(\d+)\.(\d+)$/',$version,$m)) throw new \InvalidArgumentException('Invalid visual contract version.');
        if(!in_array((int)$m[1],self::SUPPORTED_MAJORS,true)) throw new \RuntimeException('Unsupported visual contract major version.');
        return ((int)$m[1]).'.'.((int)$m[2]);
    }

    public static function canRead(string $producerVersion): bool
    {
        try { self::normalize($producerVersion); return true; }
        catch(\Throwable) { return false; }
    }
}
