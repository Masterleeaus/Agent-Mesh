<?php
$root=dirname(__DIR__);$route=file_get_contents($root.'/Services/RouteCalculationService.php')?:'';$matrix=file_get_contents($root.'/Services/TravelMatrixService.php')?:'';
foreach([['route',$route],['matrix',$matrix]] as [$label,$text]){if(!str_contains($text,"MAPS_PROVIDER_QUOTA_EXCEEDED")||!str_contains($text,'throw $exception')){fwrite(STDERR,"FAIL $label does not fail closed on hard quota\n");exit(1);}}
echo "PASS hard quota fail-closed architecture\n";
