<?php

declare(strict_types=1);
$root=dirname(__DIR__);$errors=[];
$required=['DTO/TerritoryMatchResult.php','Services/ServiceTerritoryMatcher.php','Services/ServiceTerritoryService.php','Services/GeographicPricingSignalBuilder.php','Services/TravelZoneRuleEvaluator.php','Contracts/GeographicPricingSignalProvider.php','Models/ServiceTerritory.php','Models/TerritoryEvaluation.php','Models/GeographicPricingSignal.php','Http/Controllers/ServiceTerritoryController.php','Http/Controllers/GeographicPricingController.php','Tools/ManageServiceTerritoryTool.php','Tools/ReadServiceTerritoriesTool.php','Tools/EvaluateServiceTerritoryTool.php','Tools/ReadGeographicPricingSignalsTool.php'];
foreach($required as $f) if(!is_file($root.'/'.$f)) $errors[]="missing {$f}";
$m=array_filter(glob($root.'/database/migrations/*.php')?:[],fn($f)=>str_contains(basename($f),'service_territories')||str_contains(basename($f),'territory_evaluations')); if(count($m)<2)$errors[]='expected service territory/evaluation migrations';
$p=glob($root.'/database/migrations/*geographic_pricing*.php')?:[]; if(count($p)<1)$errors[]='expected geographic pricing signal migration';
$routes=@file_get_contents($root.'/routes/user.php')?:''; foreach(['territories/service-areas','territories/travel-zones','territories/geographic-pricing'] as $n) if(!str_contains($routes,$n))$errors[]="user route missing {$n}";
$api=@file_get_contents($root.'/routes/api.php')?:''; foreach(['service-territories','territory-evaluations','geographic-pricing-signals'] as $n) if(!str_contains($api,$n))$errors[]="api missing {$n}";
$menu=@file_get_contents($root.'/System/Navigation/MapsMenuDefinition.php')?:''; foreach(['Service Areas','Travel Zones','Geographic Pricing'] as $n) if(!str_contains($menu,$n))$errors[]="menu missing {$n}";
$cap=@file_get_contents($root.'/Services/MapsCapabilityService.php')?:''; foreach(['territory.manage','territory.evaluate','geographic-pricing.read'] as $n) if(!str_contains($cap,$n))$errors[]="capability missing {$n}";

$service=@file_get_contents($root.'/Services/ServiceTerritoryService.php')?:'';
foreach(['STATUSES','validateCoordinate','validatePolygonGeometry'] as $needle) if(!str_contains($service,$needle)) $errors[]="service validation invariant missing {$needle}";
$provider=@file_get_contents($root.'/System/TitanMapsIntelligenceServiceProvider.php')?:'';
foreach(['GeographicPricingSignalProvider::class','ServiceTerritoryService::class'] as $needle) if(!str_contains($provider,$needle)) $errors[]="pricing signal provider binding missing {$needle}";

$builder=@file_get_contents($root.'/Services/GeographicPricingSignalBuilder.php')?:''; foreach(['authoritative'=>false,'not_applied'] as $k=>$v) { $needle=is_int($k)?$v:$k; if(!str_contains($builder,(string)$needle))$errors[]="pricing authority invariant missing {$needle}"; }
if($errors){fwrite(STDERR,"Service territory verification FAILED\n - ".implode("\n - ",$errors)."\n");exit(1);} echo "Service territories verification: PASS\n";
