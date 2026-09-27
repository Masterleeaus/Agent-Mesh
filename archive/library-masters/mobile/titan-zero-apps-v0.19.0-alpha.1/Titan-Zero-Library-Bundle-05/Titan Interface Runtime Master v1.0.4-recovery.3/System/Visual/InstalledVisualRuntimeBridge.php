<?php
declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Visual;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\VisualRuntimeBridge;
use Illuminate\Contracts\Container\Container;

final class InstalledVisualRuntimeBridge implements VisualRuntimeBridge
{
    public function __construct(private readonly Container $app, private readonly PassThroughVisualRuntimeBridge $fallback) {}

    public function decorate(array $semanticTree,array $visualHints,array $environment=[]): array
    {
        $contract='App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime';
        $environmentClass='App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualEnvironment';
        $preferencesClass='App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualPreferences';
        if(!interface_exists($contract)||!class_exists($environmentClass)||!class_exists($preferencesClass)||!$this->app->bound($contract)){
            return $this->fallback->decorate($semanticTree,$visualHints,$environment);
        }

        $surface=(string)($environment['surface']??'');
        if(!in_array($surface,['zero','go','hub'],true)) return $this->fallback->decorate($semanticTree,$visualHints,$environment);

        $device=(array)($environment['device']??[]);
        $connectivity=$environment['connectivity']??'unknown';
        if(is_array($connectivity)) $connectivity=$connectivity['state']??'unknown';

        $env=new $environmentClass(
            surface:$surface,
            deviceClass:(string)($device['class']??$device['device_class']??'unknown'),
            width:(int)($device['width']??0),
            devicePixelRatio:(float)($device['device_pixel_ratio']??$device['dpr']??1.0),
            webgl:(bool)($device['webgl']??false),
            canvas:(bool)($device['canvas']??true),
            lowPower:(bool)($device['low_power']??false),
            connectivity:(string)$connectivity,
            memoryMb:isset($device['memory_mb'])?(int)$device['memory_mb']:null,
            gpuTier:isset($device['gpu_tier'])?(string)$device['gpu_tier']:null,
        );
        $prefs=new $preferencesClass(
            reducedMotion:(bool)($device['reduced_motion']??false),
            highContrast:(bool)($device['high_contrast']??false),
            textScale:(float)($device['text_scale']??1.0),
            screenReader:(bool)($device['screen_reader']??false),
        );
        $request=[
            'visualTreatment'=>$visualHints['treatment']??$visualHints['visualTreatment']??'default',
            'motionPreset'=>$visualHints['motion']??$visualHints['motionPreset']??'standard',
            'transitionPreset'=>$visualHints['transition']??$visualHints['transitionPreset']??'crossfade',
            'visualCapabilityRequirements'=>(array)($visualHints['capabilities']??$visualHints['visualCapabilityRequirements']??[]),
            'densityRules'=>(array)($visualHints['density_rules']??$visualHints['densityRules']??[]),
            'contrastRules'=>(array)($visualHints['contrast_rules']??$visualHints['contrastRules']??[]),
        ];
        $plan=$this->app->make($contract)->plan($request,$env,$prefs);
        $semanticTree['_visual']=['status'=>'planned','runtime'=>'titan-visual-runtime','plan'=>$plan,'requested'=>$visualHints];
        return $semanticTree;
    }
}
