<?php

declare(strict_types=1);
$root=dirname(__DIR__);$errors=[];
$required=['Services/SpatialExecutionContextStore.php','Events/SpatialCapabilityExecuted.php','Events/SpatialCapabilityDenied.php','Events/RouteFallbackUsed.php','Events/TerritoryConflictDetected.php','Events/ServiceAreaExcluded.php','Events/GeospatialAnomalyDetected.php'];
foreach($required as $f)if(!is_file($root.'/'.$f))$errors[]="missing {$f}";
$checks=[
 'Services/RouteCalculationService.php'=>['maps.route.failed','maps.route.fallback_used','SpatialSignalPublisher'],
 'Services/ServiceTerritoryService.php'=>['maps.territory.conflict','maps.service_area.excluded','SpatialSignalPublisher'],
 'Services/WorkerTrackingService.php'=>['maps.geospatial.anomaly','maps.worker_location.accepted','SpatialSignalPublisher'],
 'Services/GovernedSpatialCapabilityExecutor.php'=>['SpatialExecutionContextStore','maps.capability.executed','maps.capability.denied'],
];
foreach($checks as $file=>$needles){$text=@file_get_contents($root.'/'.$file)?:'';foreach($needles as $n)if(!str_contains($text,$n))$errors[]="{$file} missing {$n}";}
$eventBase=@file_get_contents($root.'/Events/MapsDomainEvent.php')?:'';foreach(['company_id','trace_id'] as $n)if(!str_contains($eventBase,$n))$errors[]="MapsDomainEvent missing {$n}";
if($errors){fwrite(STDERR,"Spatial Signal integration verification FAILED\n - ".implode("\n - ",$errors)."\n");exit(1);}echo "Spatial Signal integration verification: PASS\n";
