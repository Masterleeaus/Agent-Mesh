<?php

declare(strict_types=1);
$root=dirname(__DIR__);
foreach(['Exceptions/MapsIntelligenceException.php','Services/MapsConfiguration.php','Services/SpatialCapabilityPolicyCatalog.php','Services/MapsCapabilityService.php'] as $f){if(!is_file($root.'/'.$f)){fwrite(STDERR,"Missing {$f}\n");exit(1);}require_once $root.'/'.$f;}
$canonical=[
'location.geocode'=>'Tools/GeocodeLocationTool.php',
'territory.lookup'=>'Tools/LookupTerritoryTool.php',
'territory.validate'=>'Tools/ValidateTerritoryTool.php',
'route.estimate'=>'Tools/EstimateRouteTool.php','route.compare'=>'Tools/CompareRoutesTool.php',
'job.travel_context'=>'Tools/GetJobTravelContextTool.php','service_area.check'=>'Tools/CheckServiceAreaTool.php','nearby.search'=>'Tools/NearbySearchTool.php'];
foreach($canonical as $id=>$file)if(!is_file($root.'/'.$file)){fwrite(STDERR,"Missing canonical handler {$file}\n");exit(1);}
if(!is_file($root.'/Services/JobTravelContextService.php')){fwrite(STDERR,"Missing JobTravelContextService\n");exit(1);}
$config=require $root.'/config/titan_maps_intelligence.php';
$svc=new App\Extensions\TitanMapsIntelligence\Services\MapsCapabilityService(new App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration($config),new App\Extensions\TitanMapsIntelligence\Services\SpatialCapabilityPolicyCatalog());
$defs=$svc->definitions();$ids=array_column($defs,'id');
foreach(array_keys($canonical) as $id)if(!in_array($id,$ids,true)){fwrite(STDERR,"Canonical capability missing {$id}\n");exit(1);}
$legacy=[
'titan-maps-intelligence.search.businesses','titan-maps-intelligence.search.read','titan-maps-intelligence.search.cancel','titan-maps-intelligence.search.export','titan-maps-intelligence.candidates.list','titan-maps-intelligence.candidate.match','titan-maps-intelligence.candidate.classify','titan-maps-intelligence.candidate.approve','titan-maps-intelligence.candidate.reject','titan-maps-intelligence.candidate.promote','titan-maps-intelligence.territory.analyse','titan-maps-intelligence.territory-analytics.run','titan-maps-intelligence.territory-analytics.read','titan-maps-intelligence.territory.manage','titan-maps-intelligence.territory.read','titan-maps-intelligence.territory.evaluate','titan-maps-intelligence.geographic-pricing.read','titan-maps-intelligence.route.calculate','titan-maps-intelligence.route.history','titan-maps-intelligence.travel-matrix.calculate','titan-maps-intelligence.route-plan.manage','titan-maps-intelligence.route-plan.read','titan-maps-intelligence.nearest-resource.find','titan-maps-intelligence.dispatch.recommend','titan-maps-intelligence.dispatch.read','titan-maps-intelligence.dispatch.decide','titan-maps-intelligence.resource-fallback.start','titan-maps-intelligence.resource-fallback.read','titan-maps-intelligence.resource-fallback.decide','titan-maps-intelligence.resource-fallback.promote','titan-maps-intelligence.usage.read'];
foreach($legacy as $id)if(!in_array($id,$ids,true)){fwrite(STDERR,"Legacy capability lost {$id}\n");exit(1);}
if(count($defs)!==44){fwrite(STDERR,"Expected 44 total capabilities, got ".count($defs)."\n");exit(1);}
$job=@file_get_contents($root.'/Services/JobTravelContextService.php')?:'';
foreach(['FieldReferenceGateway','MapLocationService','ServiceTerritoryService','SpatialKnowledgeGateway'] as $needle)if(!str_contains($job,$needle)){fwrite(STDERR,"Job travel context missing {$needle}\n");exit(1);}
if(str_contains($job,'crm_work_orders')||str_contains($job,'customer_name')){fwrite(STDERR,"Job travel context copies CRM authoritative data\n");exit(1);}
echo "Canonical spatial capabilities runtime: PASS\n";
