<?php

declare(strict_types=1);
$root=dirname(__DIR__);$file='Services/TravelZoneRuleEvaluator.php';if(!is_file($root.'/'.$file)){fwrite(STDERR,"Missing {$file}\n");exit(1);}require_once $root.'/'.$file;
use App\Extensions\TitanMapsIntelligence\Services\TravelZoneRuleEvaluator;
$e=new TravelZoneRuleEvaluator();
if(!$e->matches(['match_mode'=>'road_distance','maximum_road_distance_metres'=>25000],['road_distance_metres'=>24000,'straight_line_distance_metres'=>15000,'duration_seconds'=>1800])){fwrite(STDERR,"provider road distance should match\n");exit(1);}
if($e->matches(['match_mode'=>'road_distance','maximum_road_distance_metres'=>25000],['road_distance_metres'=>null,'straight_line_distance_metres'=>15000,'duration_seconds'=>null])){fwrite(STDERR,"straight-line fallback must not qualify road-distance zone\n");exit(1);}
if(!$e->matches(['match_mode'=>'drive_time','maximum_drive_time_seconds'=>1800],['road_distance_metres'=>24000,'duration_seconds'=>1700])){fwrite(STDERR,"provider ETA should match drive-time zone\n");exit(1);}
if($e->matches(['match_mode'=>'drive_time','maximum_drive_time_seconds'=>1800],['road_distance_metres'=>24000,'duration_seconds'=>null])){fwrite(STDERR,"missing ETA must not qualify drive-time zone\n");exit(1);}
echo "Travel zone runtime: PASS\n";
