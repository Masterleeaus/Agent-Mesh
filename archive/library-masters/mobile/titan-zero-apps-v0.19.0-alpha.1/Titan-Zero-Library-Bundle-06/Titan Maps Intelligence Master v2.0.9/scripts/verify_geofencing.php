<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$required = [
    'Models/MapGeofence.php',
    'Models/MapGeofenceEvent.php',
    'Models/MapGeofenceWorkerState.php',
    'Services/GeofenceGeometryService.php',
    'Support/GeofenceMath.php',
    'Support/GeofenceTransitionFilter.php',
    'scripts/test_geofence_transition_runtime.php',
    'Events/WorkerEnteredJobGeofence.php',
    'Events/WorkerExitedJobGeofence.php',
    'Events/WorkerArrivedAtJob.php',
    'Events/WorkerDepartedJob.php',
    'Events/GeofenceDwellThresholdReached.php',
    'scripts/test_geofence_math_runtime.php',
    'Services/GeofenceEvaluationService.php',
    'Services/GeofenceManagementService.php',
    'Http/Controllers/GeofenceController.php',
    'database/migrations/2026_08_10_000700_create_maps_geofences_table.php',
    'database/migrations/2026_08_10_000800_create_maps_geofence_events_table.php',
    'database/migrations/2026_08_10_000900_create_maps_geofence_worker_states_table.php',
    'database/migrations/2026_08_10_001000_sync_geofence_navigation.php',
];
$missing = array_values(array_filter($required, static fn (string $file): bool => ! is_file($root.'/'.$file)));
if ($missing !== []) {
    fwrite(STDERR, "Missing geofence files:\n - ".implode("\n - ", $missing)."\n");
    exit(1);
}

$userRoutes = file_get_contents($root.'/routes/user.php');
$apiRoutes = file_get_contents($root.'/routes/api.php');
$menu = file_get_contents($root.'/System/Navigation/MapsMenuDefinition.php');
$engine = file_get_contents($root.'/resources/js/titan-map-engine.js');
$worker = file_get_contents($root.'/Services/WorkerTrackingService.php');
$config = file_get_contents($root.'/config/titan_maps_intelligence.php');

$assertions = [
    "field.geofences route" => str_contains($userRoutes, "name('field.geofences')"),
    "geofence create API" => str_contains($apiRoutes, "geofences") && str_contains($apiRoutes, "GeofenceController"),
    "Geofences menu" => str_contains($menu, "'label'=>'Geofences'"),
    "draw mode" => str_contains($engine, 'data-titan-map-draw') || str_contains($engine, 'drawMode'),
    "worker evaluation" => str_contains($worker, 'GeofenceEvaluationService'),
    "confirmation UI" => str_contains(file_get_contents($root.'/resources/views/user/navigation.blade.php'), 'data-geofence-confirm'),
    "domain events" => str_contains(file_get_contents($root.'/Services/GeofenceEvaluationService.php'), 'WorkerEnteredJobGeofence') && str_contains(file_get_contents($root.'/Services/GeofenceManagementService.php'), 'WorkerArrivedAtJob'),
    "jitter config" => str_contains($config, "'geofencing'") && str_contains($config, 'transition_samples'),
];
foreach ($assertions as $name => $ok) {
    if (! $ok) {
        fwrite(STDERR, "Failed: {$name}\n");
        exit(1);
    }
}

echo "Geofence architecture verifier: PASS\n";
