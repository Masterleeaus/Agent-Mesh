<?php
declare(strict_types=1);
namespace App\Extensions\TitanBuilder\System\Contracts;

final class SuiteRuntimeCompatibility
{
    public const SURFACES=['zero','go','hub'];
    public const TENANT_BOUNDARY='company_id';

    public static function assertComponentRegistry(string $contract): void
    {
        if($contract!==ComponentRegistry::class) throw new \RuntimeException('Interface Runtime must consume canonical Builder ComponentRegistry.');
    }

    public static function assertCompanyBoundary(string $boundary): void
    {
        if($boundary!==self::TENANT_BOUNDARY) throw new \RuntimeException('company_id is the sole canonical tenant boundary.');
    }
}
