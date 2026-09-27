<?php

declare(strict_types=1);
$root=dirname(__DIR__);
foreach(['Exceptions/MapsIntelligenceException.php','Services/MapsConfiguration.php','Services/SpatialCapabilityPolicyCatalog.php','Services/MapsCapabilityService.php','Services/OfflineSpatialCapabilityManifest.php'] as $f){if(!is_file($root.'/'.$f)){fwrite(STDERR,"Missing {$f}\n");exit(1);}require_once $root.'/'.$f;}
$config=require $root.'/config/titan_maps_intelligence.php';
$service=new App\Extensions\TitanMapsIntelligence\Services\MapsCapabilityService(new App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration($config),new App\Extensions\TitanMapsIntelligence\Services\SpatialCapabilityPolicyCatalog());
$defs=$service->definitions();
$keys=['capability_name','owner','risk_profile','autonomy_requirement','evidence_requirements','offline_policy','reversibility','idempotency_strategy','mutation_class','input_schema','output_schema'];
foreach($defs as $def){
 foreach($keys as $k)if(!array_key_exists($k,$def)){fwrite(STDERR,"{$def['id']} missing governance metadata {$k}\n");exit(1);}
 $props=$def['input_schema']['properties']??[];
 foreach(['trace_id','correlation_id','causation_id'] as $k)if(!array_key_exists($k,$props)){fwrite(STDERR,"{$def['id']} missing execution property {$k}\n");exit(1);}
 if(array_key_exists('execution_origin',$props)){fwrite(STDERR,"{$def['id']} exposes spoofable execution_origin\n");exit(1);}
 foreach(['company_id','tenant_id'] as $k)if(array_key_exists($k,$props)){fwrite(STDERR,"{$def['id']} exposes tenant override {$k}\n");exit(1);}
 if(($def['mutation_class']??null)==='authoritative_mutation' && ($def['offline_policy']??null)!=='OFFLINE_BLOCKED'){fwrite(STDERR,"{$def['id']} authoritative mutation is not offline blocked\n");exit(1);}
}
$manifest=(new App\Extensions\TitanMapsIntelligence\Services\OfflineSpatialCapabilityManifest($service))->all();
if(count($manifest)!==45){fwrite(STDERR,"Offline manifest expected 45 entries (44 governed capabilities + worker location replay)\n");exit(1);}
foreach($manifest as $row){foreach(['id','offline_policy','risk_profile','autonomy_requirement','mutation_class'] as $k)if(!array_key_exists($k,$row)){fwrite(STDERR,"Offline manifest row missing {$k}\n");exit(1);}if(isset($row['handler'])||isset($row['provider'])||isset($row['credential'])){fwrite(STDERR,"Offline manifest leaks implementation/provider details\n");exit(1);}}
$routes=@file_get_contents($root.'/routes/api.php')?:'';if(!str_contains($routes,'offline-capabilities')){fwrite(STDERR,"Offline capability API route missing\n");exit(1);}
if(!is_file($root.'/Http/Controllers/OfflineCapabilityManifestController.php')){fwrite(STDERR,"Offline capability controller missing\n");exit(1);}
echo "Spatial offline policy runtime: PASS\n";
