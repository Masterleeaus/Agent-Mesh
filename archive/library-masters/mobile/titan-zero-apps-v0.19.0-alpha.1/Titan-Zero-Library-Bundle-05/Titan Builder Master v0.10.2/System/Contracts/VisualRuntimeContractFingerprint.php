<?php
declare(strict_types=1);
namespace App\Extensions\TitanBuilder\System\Contracts;
final class VisualRuntimeContractFingerprint
{
    public const CONTRACT_VERSION='1.1';
    public const SCHEMA_SHA256='38f0752dedb7578fde0eda36e7b145879a4fb8a27049664faecdd0b1afa10745';
    public static function assertSchema(string $json): void {
        if(hash('sha256',$json)!==self::SCHEMA_SHA256) throw new \RuntimeException('Builder visual metadata contract drift detected.');
    }
}
