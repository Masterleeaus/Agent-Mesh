<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$required = [
    'DTO/RoutePlanStopInput.php',
    'DTO/RoutePlanOptimisation.php',
    'Services/RoutePlanOptimiser.php',
    'Services/RoutePlanService.php',
    'Models/RoutePlan.php',
    'Models/RoutePlanStop.php',
    'Models/RoutePlanRun.php',
    'Http/Controllers/RoutePlanController.php',
];
$errors = [];
foreach ($required as $path) {
    if (!is_file($root.'/'.$path)) $errors[] = "missing {$path}";
}

$migrations = glob($root.'/database/migrations/*route_plan*.php') ?: [];
if (count($migrations) < 3) $errors[] = 'expected at least 3 route-plan schema migrations';

$userRoutes = @file_get_contents($root.'/routes/user.php') ?: '';
foreach (['travel/planner', 'route-plan.manage'] as $needle) {
    if (!str_contains($userRoutes, $needle)) $errors[] = "user routes missing {$needle}";
}

$apiRoutes = @file_get_contents($root.'/routes/api.php') ?: '';
foreach (['route-plans', 'route-plan.manage'] as $needle) {
    if (!str_contains($apiRoutes, $needle)) $errors[] = "api routes missing {$needle}";
}

$menu = @file_get_contents($root.'/System/Navigation/MapsMenuDefinition.php') ?: '';
if (!str_contains($menu, "'Route Planner'")) $errors[] = 'navigation missing Route Planner';

$manifest = json_decode((string) @file_get_contents($root.'/extension.manifest.json'), true) ?: [];
$caps = $manifest['capabilities'] ?? [];
foreach (['titan-maps-intelligence.route-plan.manage', 'titan-maps-intelligence.route-plan.read'] as $cap) {
    if (!in_array($cap, $caps, true)) $errors[] = "manifest missing capability {$cap}";
}

if ($errors) {
    fwrite(STDERR, "Route planning verification FAILED\n - ".implode("\n - ", $errors)."\n");
    exit(1);
}

echo "Route planning verification: PASS\n";
