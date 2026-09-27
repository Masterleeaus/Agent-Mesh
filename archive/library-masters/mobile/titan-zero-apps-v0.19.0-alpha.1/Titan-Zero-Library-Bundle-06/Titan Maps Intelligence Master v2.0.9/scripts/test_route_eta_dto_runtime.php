<?php

declare(strict_types=1);

require dirname(__DIR__).'/Exceptions/MapsIntelligenceException.php';
require dirname(__DIR__).'/DTO/RouteCalculationResult.php';

use App\Extensions\TitanMapsIntelligence\DTO\RouteCalculationResult;

$now = new DateTimeImmutable('2026-08-11T00:00:00+00:00');
$estimate = new RouteCalculationResult('straight_line_estimate', null, null, 4200, null, null, null, 'unavailable', null, $now, null, 'r1', 'e1', null, 'MAPS_PROVIDER_UNAVAILABLE');
if ($estimate->distanceBasis() !== 'straight_line_estimate' || $estimate->etaBasis() !== 'unavailable' || $estimate->freshnessStatus() !== 'estimate') {
    fwrite(STDERR, "estimate semantics failed\n"); exit(1);
}
$stale = new RouteCalculationResult('last_valid_snapshot', 'google-routes', 5100, 4200, 900, 720, 180, 'stale_snapshot', 'abc', $now, $now, 'r2', 'e2', 'source1', 'MAPS_PROVIDER_UNAVAILABLE');
if ($stale->distanceBasis() !== 'road_distance' || $stale->etaBasis() !== 'stale_snapshot' || $stale->freshnessStatus() !== 'stale') {
    fwrite(STDERR, "stale semantics failed\n"); exit(1);
}
try {
    new RouteCalculationResult('straight_line_estimate', null, 5000, 4200, 800, null, null, 'unavailable', null, $now, null, null, null, null, null);
    fwrite(STDERR, "invalid straight-line claim was accepted\n"); exit(1);
} catch (Throwable $e) {
    if (!method_exists($e, 'errorCode') || $e->errorCode() !== 'MAPS_ROUTE_RESULT_INVALID') throw $e;
}
echo "ROUTE ETA DTO RUNTIME PASS\n";
