<?php

declare(strict_types=1);

$root = dirname(__DIR__);
foreach ([
    'DTO/Coordinates.php',
    'DTO/RoutePlanStopInput.php',
    'DTO/RoutePlanOptimisation.php',
    'Services/RoutePlanOptimiser.php',
] as $file) {
    require_once $root.'/'.$file;
}

use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RoutePlanStopInput;
use App\Extensions\TitanMapsIntelligence\Services\RoutePlanOptimiser;

$stops = [
    new RoutePlanStopInput('depot-a', 'depot', 'Depot', new Coordinates(-37.8136, 144.9631), 0, null, null, true, 0),
    new RoutePlanStopInput('job-far', 'job', 'Far job', new Coordinates(-37.7500, 145.1200), 1800, null, null, false, 1),
    new RoutePlanStopInput('job-near', 'job', 'Near job', new Coordinates(-37.8200, 144.9800), 1800, null, null, false, 2),
    new RoutePlanStopInput('job-window', 'job', 'Window job', new Coordinates(-37.8300, 145.0000), 1800, '2026-08-11T09:00:00+10:00', '2026-08-11T10:30:00+10:00', true, 3),
];

// Directed duration/distance matrix keyed "from:to". Locked stop index 3 must remain index 3.
$matrix = [
    '0:1'=>['duration'=>3600,'distance'=>50000], '0:2'=>['duration'=>600,'distance'=>8000], '0:3'=>['duration'=>1200,'distance'=>15000],
    '1:2'=>['duration'=>3000,'distance'=>42000], '1:3'=>['duration'=>2400,'distance'=>35000],
    '2:1'=>['duration'=>3000,'distance'=>42000], '2:3'=>['duration'=>900,'distance'=>10000],
    '3:1'=>['duration'=>2400,'distance'=>35000], '3:2'=>['duration'=>900,'distance'=>10000],
];

$optimizer = new RoutePlanOptimiser();
$result = $optimizer->optimise($stops, $matrix, '2026-08-11T08:00:00+10:00');
$order = array_map(fn($s) => $s->id, $result->orderedStops);

if ($order !== ['depot-a','job-near','job-far','job-window']) {
    fwrite(STDERR, 'Unexpected order: '.json_encode($order)."\n");
    exit(1);
}
if (($result->orderedStops[3]->id ?? null) !== 'job-window') {
    fwrite(STDERR, "Locked stop moved\n");
    exit(1);
}
if ($result->baselineDurationSeconds <= $result->optimisedDurationSeconds) {
    fwrite(STDERR, "Expected optimised duration to improve baseline\n");
    exit(1);
}
if ($result->durationSavingsSeconds <= 0 || $result->distanceSavingsMetres <= 0) {
    fwrite(STDERR, "Expected positive savings\n");
    exit(1);
}
if (!is_array($result->schedule)) {
    fwrite(STDERR, "Expected schedule output\n");
    exit(1);
}
if (count($result->windowViolations) !== 1 || ($result->windowViolations[0]['stop_id'] ?? null) !== 'job-window') {
    fwrite(STDERR, "Expected locked appointment conflict to be surfaced exactly once\n");
    exit(1);
}

echo "Route plan optimiser runtime: PASS\n";
