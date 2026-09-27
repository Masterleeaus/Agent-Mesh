<?php

declare(strict_types=1);

$root=dirname(__DIR__);
require $root.'/Exceptions/MapsIntelligenceException.php';
require $root.'/DTO/Coordinates.php';
require $root.'/DTO/RouteRequest.php';
require $root.'/DTO/RouteMatrixRequest.php';
require $root.'/Services/MapsConfiguration.php';

use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

$config=new MapsConfiguration(require $root.'/config/titan_maps_intelligence.php');
$r=new RouteMatrixRequest([new Coordinates(-37.81,144.96)],[new Coordinates(-37.82,144.97),new Coordinates(-37.83,144.98)]);
if($r->elementCount()!==2) { fwrite(STDERR,"matrix element count failed\n"); exit(1); }
$config->assertMatrixLimits(1,2,'TRAFFIC_AWARE');
try { $config->assertMatrixLimits(11,10,'TRAFFIC_AWARE_OPTIMAL'); fwrite(STDERR,"optimal quota limit not enforced\n"); exit(1); }
catch(MapsIntelligenceException $e){ if($e->errorCode()!=='MAPS_ROUTE_MATRIX_LIMIT_EXCEEDED') throw $e; }
try { $config->assertMatrixLimits(11,10,'TRAFFIC_AWARE','TRANSIT'); fwrite(STDERR,"transit quota limit not enforced\n"); exit(1); }
catch(MapsIntelligenceException $e){ if($e->errorCode()!=='MAPS_ROUTE_MATRIX_LIMIT_EXCEEDED') throw $e; }
if($config->nearestCandidatePool() < $config->nearestResourceLimit()) { fwrite(STDERR,"candidate pool invariant failed\n"); exit(1); }
if($config->nearestCandidatePool() > $config->matrixMaximumDestinations()) { fwrite(STDERR,"candidate pool exceeds destination cap\n"); exit(1); }
echo "TRAVEL MATRIX RUNTIME PASS\n";
