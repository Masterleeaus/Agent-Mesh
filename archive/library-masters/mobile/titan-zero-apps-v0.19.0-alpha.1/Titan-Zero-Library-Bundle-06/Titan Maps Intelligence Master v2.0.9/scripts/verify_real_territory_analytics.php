<?php

declare(strict_types=1);
$root=dirname(__DIR__);$errors=[];
$required=[
'Services/TerritoryGridBuilder.php','Services/TerritoryAnalytics/ProviderCoverageAnalyzer.php','Services/TerritoryAnalytics/CompetitorDensityAnalyzer.php','Services/TerritoryAnalytics/SupplierAccessAnalyzer.php','Services/TerritoryAnalytics/ServiceGapAnalyzer.php','Services/TerritoryAnalytics/BranchCoverageAnalyzer.php','Services/TerritoryAnalytics/ExpansionOpportunityAnalyzer.php','Services/TerritoryAnalyticsManager.php','Models/TerritoryAnalysisCell.php','Http/Controllers/TerritoryAnalyticsController.php','Tools/RunTerritoryAnalyticsTool.php','Tools/ReadTerritoryAnalyticsTool.php'];
foreach($required as $f)if(!is_file($root.'/'.$f))$errors[]="missing {$f}";
$m=glob($root.'/database/migrations/*territory_analysis*.php')?:[];if(count($m)<2)$errors[]='expected methodology/cell territory analytics migrations';
$service=@file_get_contents($root.'/Services/TerritoryAnalysisService.php')?:'';
foreach(['ProviderCoverageAnalyzer','CompetitorDensityAnalyzer','SupplierAccessAnalyzer','ServiceGapAnalyzer'] as $n)if(!str_contains($service,$n))$errors[]="TerritoryAnalysisService not split through {$n}";
$model=@file_get_contents($root.'/Models/TerritoryAnalysis.php')?:'';foreach(['methodology_key','methodology_version','area_square_km','input_summary','findings'] as $n)if(!str_contains($model,$n))$errors[]="analysis model missing {$n}";
$routes=@file_get_contents($root.'/routes/user.php')?:'';foreach(['territories/branch-coverage','territories/expansion-opportunities','territories/analytics/run'] as $n)if(!str_contains($routes,$n))$errors[]="user route missing {$n}";
$api=@file_get_contents($root.'/routes/api.php')?:'';foreach(['territory-analytics','territory-analytics/{mapsTerritoryAnalysis}'] as $n)if(!str_contains($api,$n))$errors[]="api route missing {$n}";
$menu=@file_get_contents($root.'/System/Navigation/MapsMenuDefinition.php')?:'';foreach(['Branch Coverage','Expansion Opportunities'] as $n)if(!str_contains($menu,$n))$errors[]="menu missing {$n}";
$cap=@file_get_contents($root.'/Services/MapsCapabilityService.php')?:'';foreach(['territory-analytics.run','territory-analytics.read'] as $n)if(!str_contains($cap,$n))$errors[]="capability missing {$n}";
$gap=@file_get_contents($root.'/Services/TerritoryAnalytics/ServiceGapAnalyzer.php')?:'';if(!str_contains($gap,'demand_status'))$errors[]='service gap must preserve demand status';
$competitor=@file_get_contents($root.'/Services/TerritoryAnalytics/CompetitorDensityAnalyzer.php')?:'';if(!str_contains($competitor,'area_square_km'))$errors[]='competitor density must use explicit area denominator';
$supplier=@file_get_contents($root.'/Services/TerritoryAnalytics/SupplierAccessAnalyzer.php')?:'';if(!str_contains($supplier,'unavailable'))$errors[]='supplier access must represent unavailable travel time';

$manifest=json_decode((string)@file_get_contents($root.'/extension.manifest.json'),true)?:[];
foreach(['titan-maps-intelligence.territory-analytics.run','titan-maps-intelligence.territory-analytics.read'] as $id)if(!in_array($id,$manifest['capabilities']??[],true))$errors[]="manifest missing {$id}";
if(!in_array('territory_analysis_cells',$manifest['database']['owned_tables']??[],true))$errors[]='manifest does not own territory_analysis_cells';
$map=@file_get_contents($root.'/Services/MapViewDataService.php')?:'';foreach(['analytics_positive','analytics_warning','analytics_gap','analytics_opportunity'] as $n)if(!str_contains($map,$n))$errors[]="map analytics overlay missing {$n}";
$view=@file_get_contents($root.'/resources/views/user/navigation.blade.php')?:'';foreach(['methodology_key','methodology_version','territoryAnalyticsType'] as $n)if(!str_contains($view,$n))$errors[]="territory analytics view missing {$n}";
if($errors){fwrite(STDERR,"Real territory analytics verification FAILED\n - ".implode("\n - ",$errors)."\n");exit(1);}echo "Real territory analytics verification: PASS\n";
