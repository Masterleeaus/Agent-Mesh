<?php

declare(strict_types=1);
$root=dirname(__DIR__);
$files=['Services/TerritoryAnalytics/ProviderCoverageAnalyzer.php','Services/TerritoryAnalytics/CompetitorDensityAnalyzer.php','Services/TerritoryAnalytics/SupplierAccessAnalyzer.php','Services/TerritoryAnalytics/ServiceGapAnalyzer.php','Services/TerritoryAnalytics/BranchCoverageAnalyzer.php','Services/TerritoryAnalytics/ExpansionOpportunityAnalyzer.php'];
foreach($files as $f){if(!is_file($root.'/'.$f)){fwrite(STDERR,"Missing {$f}\n");exit(1);}require_once $root.'/'.$f;}
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\ProviderCoverageAnalyzer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\CompetitorDensityAnalyzer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\SupplierAccessAnalyzer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\ServiceGapAnalyzer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\BranchCoverageAnalyzer;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics\ExpansionOpportunityAnalyzer;
$cells=[
 ['cell_key'=>'a','area_square_km'=>2.0,'provider_count'=>3,'internal_count'=>1,'competitor_count'=>4,'supplier_eta_seconds'=>600,'job_count'=>8,'branch_distance_km'=>4.0,'branch_public_id'=>'b1'],
 ['cell_key'=>'b','area_square_km'=>2.0,'provider_count'=>0,'internal_count'=>0,'competitor_count'=>1,'supplier_eta_seconds'=>2400,'job_count'=>10,'branch_distance_km'=>18.0,'branch_public_id'=>null],
 ['cell_key'=>'c','area_square_km'=>1.0,'provider_count'=>1,'internal_count'=>0,'competitor_count'=>0,'supplier_eta_seconds'=>null,'job_count'=>null,'branch_distance_km'=>35.0,'branch_public_id'=>null],
];
$coverage=(new ProviderCoverageAnalyzer())->analyse($cells,[]);
if(abs(($coverage['metrics']['covered_cell_ratio']??0)-2/3)>0.0001) {fwrite(STDERR,"provider coverage formula incorrect\n");exit(1);}
$density=(new CompetitorDensityAnalyzer())->analyse($cells,[]);
if(abs(($density['metrics']['competitors_per_square_km']??0)-1.0)>0.0001){fwrite(STDERR,"competitor density must equal 5 competitors / 5 km2\n");exit(1);}
$supplier=(new SupplierAccessAnalyzer())->analyse($cells,[]);
if(($supplier['metrics']['travel_time_bands']['0_15_minutes']??0)!==1||($supplier['metrics']['travel_time_bands']['unavailable']??0)!==1){fwrite(STDERR,"supplier access bands incorrect\n");exit(1);}
$gaps=(new ServiceGapAnalyzer())->analyse($cells,['target_provider_count'=>3]);
if(($gaps['cells'][2]['metrics']['demand_status']??null)!=='unavailable'){fwrite(STDERR,"missing demand was invented\n");exit(1);}
$branches=(new BranchCoverageAnalyzer())->analyse($cells,[]);
if(($branches['metrics']['assigned_cells']??0)!==1||($branches['metrics']['unassigned_cells']??0)!==2){fwrite(STDERR,"branch coverage assignment counts incorrect\n");exit(1);}
$expansion=(new ExpansionOpportunityAnalyzer())->analyse($cells,['weights'=>['demand'=>0.35,'coverage_gap'=>0.30,'competitor_pressure'=>0.15,'supplier_access'=>0.10,'branch_distance'=>0.10]]);
$scores=array_column($expansion['cells'],'score','cell_key');
if(!isset($scores['a'],$scores['b'],$scores['c'])||$scores['b']<=$scores['a']){fwrite(STDERR,"expected high-demand low-coverage cell b to outrank covered cell a\n");exit(1);}
if(($expansion['cells'][2]['metrics']['evidence_completeness']??1)>=1){fwrite(STDERR,"unknown demand must reduce expansion evidence completeness\n");exit(1);}
$methodologies=[$coverage['methodology_key'],$density['methodology_key'],$supplier['methodology_key'],$gaps['methodology_key'],$branches['methodology_key'],$expansion['methodology_key']];
if(count(array_unique($methodologies))!==6){fwrite(STDERR,"analysis modes do not have distinct methodologies\n");exit(1);}
echo "Real territory analytics runtime: PASS\n";
