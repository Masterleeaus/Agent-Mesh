<?php
$root = dirname(__DIR__);
$required = [
    'Models/TravelMatrixSnapshot.php',
    'Models/TravelMatrixElement.php',
    'Services/TravelMatrixService.php',
    'Services/NearestResourceService.php',
    'Http/Controllers/TravelMatrixController.php',
    'Tools/CalculateTravelMatrixTool.php',
    'Tools/FindNearestResourceTool.php',
    'database/migrations/2026_08_10_001200_create_maps_travel_matrix_snapshots_table.php',
    'database/migrations/2026_08_10_001210_create_maps_travel_matrix_elements_table.php',
];
$errors = [];
foreach ($required as $path) if (!is_file($root.'/'.$path)) $errors[] = "missing {$path}";
$config = file_get_contents($root.'/config/titan_maps_intelligence.php');
foreach (['travel_matrix', 'cache_ttl_seconds', 'nearest_resource_limit'] as $needle) if (!str_contains($config, $needle)) $errors[] = "config missing {$needle}";
$userRoutes = file_get_contents($root.'/routes/user.php');
if (!str_contains($userRoutes, 'travel.matrix.calculate')) $errors[] = 'user matrix calculate route missing';
$apiRoutes = file_get_contents($root.'/routes/api.php');
foreach (['matrices.calculate','nearest-resources.find'] as $needle) if (!str_contains($apiRoutes, $needle)) $errors[] = "API route missing {$needle}";

$matrixService = file_get_contents($root.'/Services/TravelMatrixService.php');
foreach (['fresh_cache','stale_matrix_snapshot','straight_line_estimate','ESTIMATE_ONLY'] as $needle) if (!str_contains($matrixService,$needle)) $errors[] = "matrix fallback/cache missing {$needle}";
$nearest = file_get_contents($root.'/Services/NearestResourceService.php');
foreach (["where('tracking_allowed',true)->where('on_duty',true)","where('review_status','approved')","worker-location.read"] as $needle) if (!str_contains($nearest,$needle)) $errors[] = "nearest-resource safety missing {$needle}";
$cap = file_get_contents($root.'/Services/MapsCapabilityService.php');
foreach (['travel-matrix.calculate','nearest-resource.find'] as $needle) if (!str_contains($cap, $needle)) $errors[] = "capability missing {$needle}";
if ($errors) { fwrite(STDERR, "TRAVEL MATRIX VERIFY FAIL\n- ".implode("\n- ", $errors)."\n"); exit(1); }
echo "TRAVEL MATRIX VERIFY PASS\n";
