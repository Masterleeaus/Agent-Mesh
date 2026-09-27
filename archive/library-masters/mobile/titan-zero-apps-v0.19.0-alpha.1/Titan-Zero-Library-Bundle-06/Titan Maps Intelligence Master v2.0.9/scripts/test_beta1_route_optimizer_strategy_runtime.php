<?php
declare(strict_types=1);
$root=dirname(__DIR__);foreach(['DTO/Coordinates.php','DTO/RoutePlanStopInput.php','DTO/RoutePlanOptimisation.php','Services/RoutePlanOptimiser.php'] as $f)require_once $root.'/'.$f;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;use App\Extensions\TitanMapsIntelligence\DTO\RoutePlanStopInput;use App\Extensions\TitanMapsIntelligence\Services\RoutePlanOptimiser;
$small=[new RoutePlanStopInput('d','depot','D',new Coordinates(0,0),0,null,null,true,0)];
for($i=1;$i<=4;$i++)$small[]=new RoutePlanStopInput('j'.$i,'job','J'.$i,new Coordinates(0,$i/100),0,null,null,false,$i);
$r=(new RoutePlanOptimiser())->optimise($small,[],'2026-08-12T08:00:00+10:00',5,10);
if($r->heuristicUsed!==false||$r->algorithm!=='exact_permutation_v2'||$r->timedOut!==false){fwrite(STDERR,"small-plan strategy failed\n");exit(1);} 
$large=[new RoutePlanStopInput('d','depot','D',new Coordinates(0,0),0,null,null,true,0)];for($i=1;$i<=11;$i++)$large[]=new RoutePlanStopInput('j'.$i,'job','J'.$i,new Coordinates(0,$i/100),0,null,null,false,$i);
$r2=(new RoutePlanOptimiser())->optimise($large,[],'2026-08-12T08:00:00+10:00',1,10);
if($r2->heuristicUsed!==true||!str_starts_with($r2->algorithm,'heuristic_')){fwrite(STDERR,"large-plan heuristic strategy failed\n");exit(1);} 
if($r2->elapsedMilliseconds<0){fwrite(STDERR,"elapsed metadata invalid\n");exit(1);} 
echo "beta1 route optimizer strategy runtime PASS\n";
