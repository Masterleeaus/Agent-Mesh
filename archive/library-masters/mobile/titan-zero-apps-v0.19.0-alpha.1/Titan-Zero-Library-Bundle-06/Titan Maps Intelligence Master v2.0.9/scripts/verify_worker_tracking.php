<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];
$required = [
    'Models/MapLocationPing.php',
    'Models/MapWorkerTrackingState.php',
    'DTO/WorkerLocationPing.php',
    'DTO/WorkerIdentity.php',
    'Contracts/WorkerIdentityResolver.php',
    'Services/AuthenticatedWorkerIdentityResolver.php',
    'Services/WorkerTrackingService.php',
    'Services/WorkerLocationRetentionService.php',
    'Http/Controllers/WorkerTrackingController.php',
    'Console/PruneWorkerLocationPingsCommand.php',
    'database/migrations/2026_08_10_000300_create_maps_location_pings_table.php',
    'database/migrations/2026_08_10_000400_create_maps_worker_tracking_states_table.php',
];
foreach ($required as $path) {
    if (! is_file($root.'/'.$path)) $errors[] = 'missing '.$path;
}

$config = (string) @file_get_contents($root.'/config/titan_maps_intelligence.php');
foreach (['worker_tracking', 'minimum_ping_interval_seconds', 'minimum_movement_metres', 'maximum_capture_age_seconds', 'retention_days'] as $needle) {
    if (! str_contains($config, $needle)) $errors[] = 'config missing '.$needle;
}

$api = (string) @file_get_contents($root.'/routes/api.php');
foreach (['worker-tracking/status', 'worker-tracking/location', 'worker-tracking/me'] as $needle) {
    if (! str_contains($api, $needle)) $errors[] = 'API missing '.$needle;
}

$service = (string) @file_get_contents($root.'/Services/WorkerTrackingService.php');
foreach (['MAPS_WORKER_OFF_DUTY', 'MAPS_TRACKING_NOT_ALLOWED', 'MAPS_LOCATION_CAPTURE_STALE', 'MAPS_LOCATION_CAPTURE_FUTURE', 'minimumPingIntervalSeconds', 'minimumMovementMetres'] as $needle) {
    if (! str_contains($service, $needle)) $errors[] = 'tracking service missing '.$needle;
}

$provider = (string) @file_get_contents($root.'/System/TitanMapsIntelligenceServiceProvider.php');
foreach (['WorkerIdentityResolver::class', 'AuthenticatedWorkerIdentityResolver::class', 'PruneWorkerLocationPingsCommand::class'] as $needle) {
    if (! str_contains($provider, $needle)) $errors[] = 'provider missing '.$needle;
}

if ($errors) {
    foreach ($errors as $error) fwrite(STDERR, "ERROR: {$error}\n");
    exit(1);
}

echo "OK: worker live-location architecture present\n";
