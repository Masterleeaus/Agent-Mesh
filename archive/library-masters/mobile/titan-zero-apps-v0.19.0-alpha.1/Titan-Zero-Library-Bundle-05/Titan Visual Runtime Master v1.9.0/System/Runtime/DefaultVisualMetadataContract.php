<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualMetadataContract;
final class DefaultVisualMetadataContract implements VisualMetadataContract
{
    public const SCHEMA_SHA256='38f0752dedb7578fde0eda36e7b145879a4fb8a27049664faecdd0b1afa10745';

    public function version(): string { return '1.1'; }

    public function assertProducerCompatible(string $producerVersion): void
    {
        if(!preg_match('/^(\d+)\.(\d+)$/',$producerVersion,$m)) throw new \RuntimeException('Invalid Builder visual metadata contract version.');
        if((int)$m[1]!==1) throw new \RuntimeException('Incompatible Builder visual metadata contract major version.');
    }

    public function assertSchemaFingerprint(string $sha256): void
    {
        if(!hash_equals(self::SCHEMA_SHA256,strtolower($sha256))) throw new \RuntimeException('Builder visual metadata schema fingerprint mismatch.');
    }
}
