<?php

declare(strict_types=1);
$root=dirname(__DIR__);
foreach(['Services/GeographicPricingSignalBuilder.php'] as $file){ if(!is_file($root.'/'.$file)){fwrite(STDERR,"Missing {$file}\n");exit(1);} require_once $root.'/'.$file; }
use App\Extensions\TitanMapsIntelligence\Services\GeographicPricingSignalBuilder;
$b=new GeographicPricingSignalBuilder();
$signals=$b->build([
 'covered'=>true,'primary_territory_id'=>'t1','branch_public_id'=>'branch-a','road_distance_metres'=>32000,'duration_seconds'=>2700,'distance_basis'=>'provider_route','eta_basis'=>'provider_route',
 'pricing_hint'=>['type'=>'fixed','value'=>25.0,'currency'=>'AUD','source_territory_id'=>'t1'],
]);
$types=array_column($signals,'signal_type');
foreach(['inside_service_area','branch_affinity','travel_distance','drive_time','surcharge_hint'] as $type){ if(!in_array($type,$types,true)){fwrite(STDERR,"Missing {$type}\n");exit(1);} }
$hint=current(array_filter($signals,fn($s)=>$s['signal_type']==='surcharge_hint'));
if(($hint['authoritative']??true)!==false||($hint['application_status']??'')!=='not_applied'){fwrite(STDERR,"pricing hint must remain advisory/not applied\n");exit(1);}
$outside=$b->build(['covered'=>false,'blocked_by'=>'exclude-1']);
if(($outside[0]['signal_type']??null)!=='excluded_area'){fwrite(STDERR,"excluded result should emit excluded_area\n");exit(1);}
echo "Geographic pricing signal runtime: PASS\n";
