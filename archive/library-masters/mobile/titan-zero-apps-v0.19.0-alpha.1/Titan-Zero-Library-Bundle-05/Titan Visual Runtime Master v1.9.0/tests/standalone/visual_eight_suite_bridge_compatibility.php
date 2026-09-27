<?php
require_once __DIR__.'/../../System/Contracts/InterfaceRuntimeBridgeCompatibility.php';
require_once __DIR__.'/../../System/Runtime/DefaultInterfaceRuntimeBridgeCompatibility.php';
require_once __DIR__.'/../../System/Contracts/VisualRuntime.php';
require_once __DIR__.'/../../System/Contracts/VisualEnvironment.php';
require_once __DIR__.'/../../System/Contracts/VisualPreferences.php';

use App\Extensions\TitanVisualRuntime\System\Runtime\DefaultInterfaceRuntimeBridgeCompatibility;
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualRuntime;

$b=new DefaultInterfaceRuntimeBridgeCompatibility();

$legacy=$b->normalizeRequest([
    'treatment'=>'glass',
    'motion'=>'standard',
    'transition'=>'crossfade',
    'capabilities'=>['canvas'],
    'density_rules'=>['mobile'=>'compact'],
    'contrast_rules'=>['default'=>'normal'],
]);

if(($legacy['visualTreatment']??null)!=='glass') throw new RuntimeException('legacy bridge treatment mapping failed');
if(($legacy['visualCapabilityRequirements'][0]??null)!=='canvas') throw new RuntimeException('legacy bridge capability mapping failed');

$new=$b->normalizeRequest([
    'visualTreatment'=>'card',
    'resourcePolicy'=>['cacheMode'=>'prefer-offline'],
    'visualPriority'=>25,
    'capabilityFallbackOrder'=>['webgl','canvas','static'],
]);
if(($new['visualPriority']??null)!==25) throw new RuntimeException('v1.1 field lost');

$p=$b->profile();
if(($p['tenant_boundary']??null)!=='company_id') throw new RuntimeException('wrong company boundary');
if(($p['business_authority']??true)!==false) throw new RuntimeException('visual runtime gained business authority');

$rc=new ReflectionClass(VisualRuntime::class);
$plan=$rc->getMethod('plan');
if(count($plan->getParameters())!==3) throw new RuntimeException('VisualRuntime plan signature drifted');

echo "VISUAL_EIGHT_SUITE_BRIDGE_COMPATIBILITY: PASS\n";
