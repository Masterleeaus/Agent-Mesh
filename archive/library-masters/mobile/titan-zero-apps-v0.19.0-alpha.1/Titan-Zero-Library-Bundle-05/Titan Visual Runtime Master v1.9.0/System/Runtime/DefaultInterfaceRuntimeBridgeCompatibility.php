<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;

use App\Extensions\TitanVisualRuntime\System\Contracts\InterfaceRuntimeBridgeCompatibility;

final class DefaultInterfaceRuntimeBridgeCompatibility implements InterfaceRuntimeBridgeCompatibility
{
    public function normalizeRequest(array $request): array
    {
        $out=[
            'visualTreatment'=>$request['visualTreatment']??$request['treatment']??'default',
            'motionPreset'=>$request['motionPreset']??$request['motion']??'standard',
            'transitionPreset'=>$request['transitionPreset']??$request['transition']??'crossfade',
            'visualCapabilityRequirements'=>(array)($request['visualCapabilityRequirements']??$request['capabilities']??[]),
            'densityRules'=>(array)($request['densityRules']??$request['density_rules']??[]),
            'contrastRules'=>(array)($request['contrastRules']??$request['contrast_rules']??[]),
        ];

        foreach([
            'resourcePolicy','visualPriority','capabilityFallbackOrder','assetRole','iconRole','mediaRole',
            'loadingTreatment','emptyTreatment','errorTreatment','reducedMotionFallback'
        ] as $key){
            if(array_key_exists($key,$request)) $out[$key]=$request[$key];
        }

        return $out;
    }

    public function profile(): array
    {
        return [
            'interface_contract'=>'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\VisualRuntimeBridge',
            'live_adapter'=>'App\\Extensions\\TitanInterfaceRuntime\\System\\Visual\\InstalledVisualRuntimeBridge',
            'visual_contract'=>'App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime',
            'canonical_surfaces'=>['zero','go','hub'],
            'tenant_boundary'=>'company_id',
            'business_authority'=>false,
        ];
    }
}
