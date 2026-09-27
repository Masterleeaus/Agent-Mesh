<?php
declare(strict_types=1);
namespace App\Extensions\TitanBuilder\System\Contracts;
final class SuiteContractNegotiator
{
    public static function negotiate(array $consumer): array
    {
        $required=(array)($consumer['required']??[]);
        $available=['ComponentRegistry','SurfaceRegistry','VisualRuntimeMetadataContract'];
        $missing=array_values(array_diff($required,$available));
        return [
            'compatible'=>$missing===[],
            'available'=>$available,
            'missing'=>$missing,
            'canonical_surfaces'=>['zero','go','hub'],
            'tenant_boundary'=>'company_id',
        ];
    }
}
