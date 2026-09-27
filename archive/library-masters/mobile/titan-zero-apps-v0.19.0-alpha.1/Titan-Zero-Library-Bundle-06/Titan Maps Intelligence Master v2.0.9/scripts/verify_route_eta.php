<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];
$required = [
    'DTO/RouteCalculationResult.php',
    'Models/RouteSnapshot.php',
    'Models/EtaSnapshot.php',
    'Services/RouteCalculationService.php',
    'Http/Controllers/RouteSnapshotController.php',
    'database/migrations/2026_08_10_001000_create_maps_route_snapshots_table.php',
    'database/migrations/2026_08_10_001100_create_maps_eta_snapshots_table.php',
];
foreach ($required as $path) {
    if (!is_file($root.'/'.$path)) $errors[] = 'missing '.$path;
}
if (is_file($root.'/Services/RouteCalculationService.php')) {
    $src = file_get_contents($root.'/Services/RouteCalculationService.php');
    foreach (['provider_route','last_valid_snapshot','straight_line_estimate'] as $needle) {
        if (!str_contains($src, $needle)) $errors[] = 'route service missing '.$needle;
    }
}
if (is_file($root.'/routes/api.php')) {
    $api = file_get_contents($root.'/routes/api.php');
    foreach (['route.calculate','route.read'] as $needle) {
        if (!str_contains($api, 'titan-maps-intelligence.'.$needle)) $errors[] = 'api missing permission '.$needle;
    }
}

$config = file_get_contents($root.'/config/titan_maps_intelligence.php');
foreach (['traffic_aware_ttl_seconds','traffic_unaware_ttl_seconds','last_valid_max_age_hours','coordinate_precision_decimals','history_limit'] as $needle) {
    if (!str_contains($config, $needle)) $errors[] = 'routing snapshot config missing '.$needle;
}
$presenter = is_file($root.'/Services/RouteResultPresenter.php') ? file_get_contents($root.'/Services/RouteResultPresenter.php') : '';
if (!str_contains($presenter, "'distance_basis'")) $errors[] = 'route presenter missing distance_basis';
if (!str_contains($presenter, "'freshness_status'")) $errors[] = 'route presenter missing freshness_status';

if ($errors) {
    fwrite(STDERR, "ROUTE ETA VERIFY FAIL\n- ".implode("\n- ", $errors)."\n");
    exit(1);
}
echo "ROUTE ETA VERIFY PASS\n";
