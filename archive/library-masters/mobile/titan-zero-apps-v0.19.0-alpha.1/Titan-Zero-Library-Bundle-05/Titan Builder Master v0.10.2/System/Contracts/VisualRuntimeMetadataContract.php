<?php
declare(strict_types=1);
namespace App\Extensions\TitanBuilder\System\Contracts;
final class VisualRuntimeMetadataContract
{
    public const VERSION='1.1';
    public const SCHEMA='titan://builder/schema/visual-metadata/v1';
    public const SURFACES=['zero','go','hub'];

    public static function assertCompatible(string $runtimeVersion): void
    {
        if((int)explode('.',$runtimeVersion)[0]!==1) throw new \RuntimeException('Incompatible Titan Visual Runtime major version.');
    }
}
