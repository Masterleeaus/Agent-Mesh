<?php
declare(strict_types=1);
$root=dirname(__DIR__);
$need=[
 'Models/MapProviderQuotaPolicy.php','Services/ProviderQuotaGuard.php','Console/ProcessGeofencesCommand.php',
 'Models/MapDispatchScoringPolicy.php','Services/DispatchScoringPolicyService.php','Services/RouteFreshnessPolicy.php',
 'Services/GeofenceConfidenceService.php','Services/ProviderCacheStore.php','Services/TerritoryConflictService.php'
];
foreach($need as $f){if(!is_file($root.'/'.$f)){fwrite(STDERR,"missing $f\n");exit(1);}}
$routing=file_get_contents($root.'/Services/RoutingService.php');
if(!str_contains($routing,'ProviderQuotaGuard')){fwrite(STDERR,"RoutingService missing quota guard\n");exit(1);} 
$tracking=file_get_contents($root.'/Services/WorkerTrackingService.php');
if(!str_contains($tracking,'geofences->evaluate')){fwrite(STDERR,"server-side geofence evaluation missing\n");exit(1);} 
$api=file_get_contents($root.'/routes/api.php');
if(str_contains($api,'geofence/enter')||str_contains($api,'geofence/exit')){fwrite(STDERR,"authoritative client geofence routes found\n");exit(1);} 
echo "beta1 hardening architecture PASS\n";
