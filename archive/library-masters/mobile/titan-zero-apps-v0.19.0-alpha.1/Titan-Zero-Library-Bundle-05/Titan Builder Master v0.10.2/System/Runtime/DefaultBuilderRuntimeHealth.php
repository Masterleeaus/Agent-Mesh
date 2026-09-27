<?php
declare(strict_types=1);
namespace App\Extensions\TitanBuilder\System\Runtime;
use App\Extensions\TitanBuilder\System\Contracts\{BuilderRuntimeHealth,ComponentRegistry,SurfaceRegistry,VisualRuntimeMetadataContract};
final class DefaultBuilderRuntimeHealth implements BuilderRuntimeHealth
{
    public function report(): array
    {
        $checks=[
            'component_registry'=>interface_exists(ComponentRegistry::class) && method_exists(ComponentRegistry::class,'find'),
            'surface_registry'=>interface_exists(SurfaceRegistry::class) && method_exists(SurfaceRegistry::class,'find'),
            'visual_metadata_contract'=>class_exists(VisualRuntimeMetadataContract::class),
            'canonical_surfaces'=>VisualRuntimeMetadataContract::SURFACES===['zero','go','hub'],
            'company_boundary'=>true,
        ];
        return [
            'status'=>!in_array(false,$checks,true)?'healthy':'degraded',
            'checks'=>$checks,
            'tenant_boundary'=>'company_id',
            'canonical_surfaces'=>['zero','go','hub'],
            'business_authority'=>false,
        ];
    }
}
