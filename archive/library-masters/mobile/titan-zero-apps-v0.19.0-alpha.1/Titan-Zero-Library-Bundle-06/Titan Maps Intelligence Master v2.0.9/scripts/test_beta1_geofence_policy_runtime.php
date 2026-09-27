<?php
declare(strict_types=1);
$root=dirname(__DIR__);
require $root.'/Services/GeofenceConfidenceService.php';
use App\Extensions\TitanMapsIntelligence\Services\GeofenceConfidenceService;
$s=new GeofenceConfidenceService();
$high=$s->confidence(5.0,50.0,3,3);
$low=$s->confidence(90.0,50.0,2,3);
if($high<90.0||$low>60.0){fwrite(STDERR,"accuracy confidence weighting failed\n");exit(1);} 
if($s->effectiveHysteresis(20.0,80.0)<=20.0){fwrite(STDERR,"accuracy-aware hysteresis failed\n");exit(1);} 
echo "beta1 geofence policy runtime PASS\n";
