<?php

declare(strict_types=1);

$root = dirname(__DIR__);
require $root.'/Exceptions/MapsIntelligenceException.php';
require $root.'/DTO/Coordinates.php';
require $root.'/DTO/WorkerLocationPing.php';
require $root.'/Services/MapsConfiguration.php';

use App\Extensions\TitanMapsIntelligence\DTO\WorkerLocationPing;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;

$config = new MapsConfiguration(require $root.'/config/titan_maps_intelligence.php');
if ($config->minimumPingIntervalSeconds() !== 10 || $config->locationRetentionDays() !== 90 || $config->maximumCaptureAgeSeconds() !== 300) {
    fwrite(STDERR, "ERROR: worker tracking configuration accessors returned unexpected values\n"); exit(1);
}
new WorkerLocationPing(-37.8136, 144.9631, 8.5, new DateTimeImmutable('now'), speedMetresPerSecond: 3.2, headingDegrees: 90.0);
try {
    new WorkerLocationPing(91.0, 144.0, 5.0, new DateTimeImmutable('now'));
    fwrite(STDERR, "ERROR: impossible latitude was accepted\n"); exit(1);
} catch (MapsIntelligenceException $e) {
    if ($e->errorCode() !== 'MAPS_INVALID_COORDINATES') { throw $e; }
}
try {
    new WorkerLocationPing(-37.8, 144.0, -1.0, new DateTimeImmutable('now'));
    fwrite(STDERR, "ERROR: negative accuracy was accepted\n"); exit(1);
} catch (MapsIntelligenceException $e) {
    if ($e->errorCode() !== 'MAPS_LOCATION_ACCURACY_INVALID') { throw $e; }
}
echo "OK: worker location DTO and tracking configuration runtime checks passed\n";
