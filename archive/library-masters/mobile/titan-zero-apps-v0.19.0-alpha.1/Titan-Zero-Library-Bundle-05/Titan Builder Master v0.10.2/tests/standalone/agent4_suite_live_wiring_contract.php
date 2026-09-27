<?php
require_once __DIR__.'/../../System/Contracts/ComponentRegistry.php';
require_once __DIR__.'/../../System/Contracts/SurfaceRegistry.php';
require_once __DIR__.'/../../System/Contracts/SuiteRuntimeCompatibility.php';

use App\Extensions\TitanBuilder\System\Contracts\{ComponentRegistry,SurfaceRegistry,SuiteRuntimeCompatibility};

$c=new ReflectionClass(ComponentRegistry::class);
if(!$c->hasMethod('find')) throw new RuntimeException('ComponentRegistry missing find');
if(count($c->getMethod('find')->getParameters())!==1) throw new RuntimeException('ComponentRegistry find signature drifted');

$s=new ReflectionClass(SurfaceRegistry::class);
if(!$s->hasMethod('find')) throw new RuntimeException('SurfaceRegistry missing find');

SuiteRuntimeCompatibility::assertComponentRegistry(ComponentRegistry::class);
SuiteRuntimeCompatibility::assertCompanyBoundary('company_id');

$m=json_decode(file_get_contents(__DIR__.'/../../extension.json'),true,512,JSON_THROW_ON_ERROR);
foreach(['ComponentRegistry','SurfaceRegistry','VisualRuntimeMetadataContract'] as $required){
    if(!in_array($required,$m['public_contracts']??[],true)) throw new RuntimeException("manifest missing $required");
}
if(($m['tenant_boundary']??null)!=='company_id') throw new RuntimeException('wrong company boundary');

echo "BUILDER_SUITE_LIVE_WIRING: PASS\n";
