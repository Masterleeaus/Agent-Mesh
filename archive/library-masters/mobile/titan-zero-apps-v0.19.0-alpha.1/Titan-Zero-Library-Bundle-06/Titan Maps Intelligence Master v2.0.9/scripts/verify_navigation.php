<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];
$required = [
    'System/Navigation/MapsMenuDefinition.php',
    'System/Navigation/MapsMenuInstaller.php',
    'Http/Controllers/UserNavigationController.php',
    'Http/Controllers/AdminNavigationController.php',
    'resources/views/user/navigation.blade.php',
    'resources/views/admin/navigation.blade.php',
    'database/migrations/2026_08_10_000200_sync_titan_maps_navigation.php',
    'database/migrations/2026_08_10_001000_sync_geofence_navigation.php',
    'database/migrations/2026_08_10_001600_sync_route_planner_navigation.php',
    'database/migrations/2026_08_11_000400_sync_dispatch_navigation.php',
    'database/migrations/2026_08_11_000800_sync_service_territory_navigation.php',
    'database/migrations/2026_08_11_001100_sync_territory_analytics_navigation.php',
    'database/migrations/2026_08_11_001500_sync_resource_fallback_navigation.php',
];
foreach ($required as $path) {
    if (! is_file($root.'/'.$path)) {
        $errors[] = 'Missing '.$path;
    }
}

$userRoutes = is_file($root.'/routes/user.php') ? (string) file_get_contents($root.'/routes/user.php') : '';
$adminRoutes = is_file($root.'/routes/admin.php') ? (string) file_get_contents($root.'/routes/admin.php') : '';
$userNames = [
    'field.index','field.locations','field.team','field.dispatch','field.resource-fallback','field.geofences','field.checkins','location.index','location.discovery','location.candidates',
    'location.suppliers','location.contractors','location.competitors','location.nearby',
    'territories.index','territories.service-areas','territories.travel-zones','territories.geographic-pricing','territories.analysis','territories.providers','territories.competitors',
    'territories.suppliers','territories.gaps','territories.branch-coverage','territories.expansion-opportunities','travel.index','travel.route','travel.matrix','travel.planner',
    'travel.traffic','settings.index','settings.providers','settings.routing','settings.tracking',
    'settings.privacy','settings.usage',
];
foreach ($userNames as $name) {
    if (! str_contains($userRoutes, "name('{$name}')")) {
        $errors[] = 'Missing user route '.$name;
    }
}
$adminNames = ['navigation.index','navigation.providers','navigation.usage','navigation.diagnostics'];
foreach ($adminNames as $name) {
    if (! str_contains($adminRoutes, "name('{$name}')")) {
        $errors[] = 'Missing admin route '.$name;
    }
}

$definition = is_file($root.'/System/Navigation/MapsMenuDefinition.php') ? (string) file_get_contents($root.'/System/Navigation/MapsMenuDefinition.php') : '';
foreach (['Field Operations','Location Intelligence','Territories and Coverage','Travel and Routing','Maps and Location'] as $label) {
    if (! str_contains($definition, "'label' => '{$label}'")) {
        $errors[] = 'Missing parent menu '.$label;
    }
}
foreach ($userNames as $name) {
    $full = 'dashboard.user.titan-maps-intelligence.'.$name;
    if (! str_contains($definition, "'route'=>'{$full}'") && ! str_contains($definition, "'route' => '{$full}'")) {
        $errors[] = 'Menu definition does not reference '.$full;
    }
}
foreach ($adminNames as $name) {
    $full = 'dashboard.admin.titan-maps-intelligence.'.$name;
    if (! str_contains($definition, "'route'=>'{$full}'") && ! str_contains($definition, "'route' => '{$full}'")) {
        $errors[] = 'Admin menu definition does not reference '.$full;
    }
}
if (str_contains($definition, "'route'=>'/dashboard/") || str_contains($definition, "'route' => '/dashboard/")) {
    $errors[] = 'Menu definition uses literal dashboard URLs instead of named routes';
}

$installer = is_file($root.'/System/Navigation/MapsMenuInstaller.php') ? (string) file_get_contents($root.'/System/Navigation/MapsMenuInstaller.php') : '';
foreach (['Schema::getColumnListing(\'menus\')','array_intersect_key','MenuService::class','regenerate','HOST_SAFE_ICONS','syncAdminSettingsFallback'] as $needle) {
    if (! str_contains($installer, $needle)) {
        $errors[] = 'Adaptive menu installer invariant missing: '.$needle;
    }
}

$migration = is_file($root.'/database/migrations/2026_08_10_000200_sync_titan_maps_navigation.php') ? (string) file_get_contents($root.'/database/migrations/2026_08_10_000200_sync_titan_maps_navigation.php') : '';
if (! str_contains($migration, 'MapsMenuInstaller::sync()') || ! str_contains($migration, 'MapsMenuInstaller::deactivate()')) {
    $errors[] = 'Navigation migration is not wired to idempotent sync/deactivation';
}

$userView = is_file($root.'/resources/views/user/navigation.blade.php') ? (string) file_get_contents($root.'/resources/views/user/navigation.blade.php') : '';
$adminView = is_file($root.'/resources/views/admin/navigation.blade.php') ? (string) file_get_contents($root.'/resources/views/admin/navigation.blade.php') : '';
if (! str_contains($userView, "@extends('panel.layout.app')")) {
    $errors[] = 'User navigation view does not extend MagicAI panel layout';
}
if (! str_contains($adminView, "@extends('panel.layout.app')")) {
    $errors[] = 'Admin navigation view does not extend MagicAI panel layout';
}

if ($errors !== []) {
    fwrite(STDERR, "NAVIGATION VERIFICATION FAILED\n- ".implode("\n- ", $errors)."\n");
    exit(1);
}

echo "NAVIGATION VERIFICATION PASS: 5 user parents, 36 user children, admin routes, adaptive menus table sync and cache refresh are wired.\n";
