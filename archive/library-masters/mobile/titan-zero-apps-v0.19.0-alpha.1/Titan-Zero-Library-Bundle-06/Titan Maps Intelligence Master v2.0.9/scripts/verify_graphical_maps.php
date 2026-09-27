<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];
$mustExist = [
    'Http/Controllers/MapAssetController.php',
    'Services/MapViewDataService.php',
    'Services/EncodedPolylineDecoder.php',
    'Http/Controllers/TravelRouteController.php',
    'resources/views/components/map-canvas.blade.php',
    'resources/js/titan-map-engine.js',
    'resources/css/titan-map-engine.css',
    'database/migrations/2026_08_10_000600_sync_graphical_map_navigation.php',
];
foreach ($mustExist as $file) {
    if (!is_file($root.'/'.$file)) $errors[] = "missing {$file}";
}

$userRoutes = @file_get_contents($root.'/routes/user.php') ?: '';
foreach (['assets/{asset}', "name('assets.show')", "name('field.team.data')", "name('travel.route.calculate')"] as $needle) {
    if (!str_contains($userRoutes, $needle)) $errors[] = "user routes missing {$needle}";
}

$view = @file_get_contents($root.'/resources/views/user/navigation.blade.php') ?: '';
foreach (['<x-titan-maps-intelligence::map-canvas', 'mapPayload', 'data-titan-route-form'] as $needle) {
    if (!str_contains($view, $needle)) $errors[] = "navigation view missing {$needle}";
}

$controller = @file_get_contents($root.'/Http/Controllers/UserNavigationController.php') ?: '';
foreach (['MapViewDataService', "'mapPayload'", "'mapUi'"] as $needle) {
    if (!str_contains($controller, $needle)) $errors[] = "controller missing {$needle}";
}

$engine = @file_get_contents($root.'/resources/js/titan-map-engine.js') ?: '';
foreach (['project(', 'renderTiles(', 'renderMarkers(', 'renderPolylines(', 'renderPolygons(', 'renderCircles(', 'fitToData(', 'setRoute(', 'pointerdown', 'wheel'] as $needle) {
    if (!str_contains($engine, $needle)) $errors[] = "map engine missing {$needle}";
}

$config = @file_get_contents($root.'/config/titan_maps_intelligence.php') ?: '';
foreach (['map_ui', 'tile_url', 'tile_attribution', 'tile_attribution_url', 'tile_max_zoom'] as $needle) {
    if (!str_contains($config, $needle)) $errors[] = "config missing {$needle}";
}

$menu = @file_get_contents($root.'/System/Navigation/MapsMenuDefinition.php') ?: '';
if (!str_contains($menu, "'label'=>'Live Map'")) $errors[] = 'Field Operations first child is not Live Map';


$mapService = @file_get_contents($root.'/Services/MapViewDataService.php') ?: '';
foreach (["where('reference_type', '!=', 'worker')", "WorkerLocationVisibilityPolicy", "canReadCompanyWide", 'where(\'user_id\', $this->context->userId())'] as $needle) {
    if (!str_contains($mapService, $needle)) $errors[] = "map privacy boundary missing {$needle}";
}
foreach (["field.team')->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.read'", "field.checkins')->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.read'"] as $needle) {
    if (!str_contains($userRoutes, $needle)) $errors[] = "worker map route permission missing {$needle}";
}

if ($errors !== []) {
    fwrite(STDERR, "Graphical map verification FAILED\n - ".implode("\n - ", $errors)."\n");
    exit(1);
}

echo "Graphical map verification PASS\n";
