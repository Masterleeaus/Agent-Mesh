<?php
declare(strict_types=1);
$root=dirname(__DIR__);
require $root.'/DTO/TerritoryMatchResult.php';
require $root.'/Services/ServiceTerritoryMatcher.php';
use App\Extensions\TitanMapsIntelligence\Services\ServiceTerritoryMatcher;
$m=new ServiceTerritoryMatcher();
$target=['latitude'=>-37.8,'longitude'=>144.96,'primary_branch_public_id'=>'branch-A','branch_distances_metres'=>['branch-A'=>5000,'branch-B'=>1000]];
$ts=[
 ['id'=>'inc-a','match_mode'=>'circle','effect'=>'include','priority'=>10,'branch_public_id'=>'branch-B','center_latitude'=>-37.8,'center_longitude'=>144.96,'radius_metres'=>1000],
 ['id'=>'inc-b','match_mode'=>'circle','effect'=>'include','priority'=>10,'branch_public_id'=>'branch-A','center_latitude'=>-37.8,'center_longitude'=>144.96,'radius_metres'=>1000],
];
$r=$m->resolve($ts,$target);
if(($r['primary_territory_id']??null)!=='inc-b'){fwrite(STDERR,"primary branch tie-break failed\n");exit(1);} 
if(!isset($r['matched_rule_chain'])||count($r['matched_rule_chain'])<1){fwrite(STDERR,"matched rule chain missing\n");exit(1);} 
$exclude=$ts; $exclude[]=['id'=>'exc','match_mode'=>'circle','effect'=>'exclude','priority'=>1,'center_latitude'=>-37.8,'center_longitude'=>144.96,'radius_metres'=>1000];
$r2=$m->resolve($exclude,$target); if($r2['covered']!==false||$r2['blocked_by']!=='exc'){fwrite(STDERR,"exclusion enforcement failed\n");exit(1);} 
echo "beta1 territory determinism runtime PASS\n";
