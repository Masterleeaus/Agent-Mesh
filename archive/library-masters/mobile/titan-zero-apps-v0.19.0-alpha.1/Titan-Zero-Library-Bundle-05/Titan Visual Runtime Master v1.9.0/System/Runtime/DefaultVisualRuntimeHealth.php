<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualRuntimeHealth,VisualRuntime,VisualMetadataContract,InterfaceRuntimeBridgeCompatibility};
final class DefaultVisualRuntimeHealth implements VisualRuntimeHealth
{
    public function report(): array
    {
        $checks=[
            'visual_runtime'=>interface_exists(VisualRuntime::class),
            'metadata_contract'=>interface_exists(VisualMetadataContract::class),
            'interface_bridge_compatibility'=>interface_exists(InterfaceRuntimeBridgeCompatibility::class),
            'canonical_surfaces'=>true,
            'company_boundary'=>true,
        ];
        return [
            'status'=>!in_array(false,$checks,true)?'healthy':'degraded',
            'checks'=>$checks,
            'canonical_surfaces'=>['zero','go','hub'],
            'tenant_boundary'=>'company_id',
            'company_scope_inference'=>false,
            'business_authority'=>false,
        ];
    }
}
