<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualRuntimeCompatibilityNegotiator;
final class DefaultVisualRuntimeCompatibilityNegotiator implements VisualRuntimeCompatibilityNegotiator
{
    public function negotiate(array $consumer): array
    {
        $contract=(string)($consumer['visual_metadata_contract']??'1.0');
        if(!preg_match('/^(\d+)\.(\d+)$/',$contract,$m)) return ['compatible'=>false,'reason'=>'invalid-contract-version'];
        if((int)$m[1]!==1) return ['compatible'=>false,'reason'=>'unsupported-major'];
        $surface=(string)($consumer['surface']??'');
        if($surface!=='' && !in_array($surface,['zero','go','hub'],true)) return ['compatible'=>false,'reason'=>'unsupported-surface'];
        return [
            'compatible'=>true,
            'visual_metadata_contract'=>'1.1',
            'canonical_surfaces'=>['zero','go','hub'],
            'tenant_boundary'=>'company_id',
            'company_scope_required_for_company_contributions'=>true,
            'business_authority'=>false,
        ];
    }
}
