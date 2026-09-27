<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];

$requiredFiles = [
    'routes/user.php', 'routes/admin.php', 'routes/api.php', 'routes/internal.php',
    'Http/Middleware/RejectClientCompanyOverride.php',
    'Http/Middleware/RequireMapsPermission.php',
    'Http/Middleware/RequireMapsAdminPermission.php',
    'Http/Middleware/RequireMapsInternalRequest.php',
    'Http/Middleware/ResolveCompanyScopedRouteBindings.php',
    'Http/Middleware/ResolveMapsCompanyContext.php',
];
foreach ($requiredFiles as $file) {
    if (! is_file($root.'/'.$file)) {
        $failures[] = 'Missing '.$file;
    }
}

$provider = (string) @file_get_contents($root.'/System/TitanMapsIntelligenceServiceProvider.php');
foreach ([
    "['web', 'auth', 'titan.maps.reject-company-override', 'titan.maps.company'",
    "['web', 'auth', 'admin', 'titan.maps.admin:titan-maps-intelligence.admin.access']",
    "['api', 'auth:sanctum', 'titan.maps.reject-company-override', 'titan.maps.company'",
    "['api', 'titan.maps.internal']",
] as $needle) {
    if (! str_contains($provider, $needle)) {
        $failures[] = 'Provider route profile missing: '.$needle;
    }
}

$api = (string) @file_get_contents($root.'/routes/api.php');
foreach ([
    'search.create', 'search.read', 'search.cancel', 'search.export', 'candidate.read',
    'candidate.classify', 'candidate.approve', 'candidate.reject', 'candidate.promote',
    'territory.analyse', 'usage.read', 'route.calculate', 'route.read', 'matrix.calculate', 'matrix.read', 'nearest-resource.find', 'route-plan.manage', 'route-plan.read', 'dispatch.recommend', 'dispatch.read', 'dispatch.manage',
] as $permission) {
    if (! str_contains($api, 'titan.maps.permission:titan-maps-intelligence.'.$permission)) {
        $failures[] = 'API permission middleware missing: '.$permission;
    }
}

$binder = (string) @file_get_contents($root.'/Http/Middleware/ResolveCompanyScopedRouteBindings.php');
foreach (['mapsSearch', 'mapsCandidate', 'mapsAnalysis', 'mapsRouteSnapshot', 'mapsRoutePlan', 'mapsDispatchRecommendation', "where('company_id', \$companyId)", 'firstOrFail()'] as $needle) {
    if (! str_contains($binder, $needle)) {
        $failures[] = 'Company route binder invariant missing: '.$needle;
    }
}

$model = (string) @file_get_contents($root.'/Models/CompanyScopedModel.php');
if (! str_contains($model, 'static::updating') || ! str_contains($model, 'hash_equals($original, $current)')) {
    $failures[] = 'company_id immutability guard missing';
}

foreach (['Jobs/ExecuteDiscoverySearch.php', 'Jobs/ProcessDiscoveryPage.php'] as $job) {
    $source = (string) @file_get_contents($root.'/'.$job);
    if (! str_contains($source, 'QueueTenantContext $tenantContext') || ! str_contains($source, '$tenantContext->run($this->companyId')) {
        $failures[] = 'Queue tenant context missing from '.$job;
    }
}

$manifest = json_decode((string) @file_get_contents($root.'/extension.manifest.json'), true);
$profiles = array_column($manifest['routes'] ?? [], 'profile');
foreach (['authenticated-user', 'admin', 'internal'] as $profile) {
    if (! in_array($profile, $profiles, true)) {
        $failures[] = 'Manifest route profile missing: '.$profile;
    }
}
if (count(array_filter($manifest['routes'] ?? [], static fn (array $route): bool => $route['prefix'] === 'api/titan/maps-intelligence')) !== 1) {
    $failures[] = 'Manifest API route profile missing or duplicated';
}


$gateAuthorizer = (string) file_get_contents($root.'/Services/GatePermissionAuthorizer.php');
if (! str_contains($gateAuthorizer, 'Gate::has($permission)')) {
    $failures[] = 'user permission fallback does not detect whether the host registered a Maps Gate ability';
}
if (! str_contains($gateAuthorizer, 'strict_host_gates')) {
    $failures[] = 'user permission fallback has no strict-host-gates switch';
}
$adminAuthorizer = (string) file_get_contents($root.'/Services/GateAdminPermissionAuthorizer.php');
if (! str_contains($adminAuthorizer, 'Gate::has($permission)')) {
    $failures[] = 'admin permission fallback does not detect whether the host registered a Maps Gate ability';
}

if ($failures !== []) {
    fwrite(STDERR, "Security verification FAILED\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

fwrite(STDOUT, "Security verification PASS: route profiles, explicit permissions, tenant-safe bindings, immutable tenant keys and queue context are present.\n");
