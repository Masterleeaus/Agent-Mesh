<?php
require_once __DIR__.'/../../System/Contracts/VisualEnvironment.php';
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualEnvironment;
$env=new VisualEnvironment(
    surface:'zero',
    deviceClass:'mobile',
    width:390,
    devicePixelRatio:3.0,
    webgl:true,
    canvas:true,
    lowPower:false,
    connectivity:'online',
    memoryMb:4096,
    gpuTier:'medium',
);
if($env->companyId!==null) throw new RuntimeException('live adapter should not infer company_id');
echo "VISUAL_LIVE_ADAPTER_CONSTRUCTOR_COMPATIBILITY: PASS\n";
