<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$mustExist = [
    'routes/web.php',
    'System/Http/Controllers/Management/CompanyManagementController.php',
    'System/Http/Controllers/Management/AdminManagementController.php',
    'System/Http/Controllers/Management/ManagementSettingsController.php',
    'System/Management/BuilderSettingsRepository.php',
    'System/Management/ManagementDashboardService.php',
    'System/Models/BuilderSetting.php',
    'database/migrations/2026_08_09_000300_create_titan_builder_settings_table.php',
    'resources/views/management/layout.blade.php',
    'resources/views/management/company/dashboard.blade.php',
    'resources/views/management/company/projects.blade.php',
    'resources/views/management/company/project-editor.blade.php',
    'resources/views/management/company/applications.blade.php',
    'resources/views/management/company/application.blade.php',
    'resources/views/management/company/assets.blade.php',
    'resources/views/management/company/brand.blade.php',
    'resources/views/management/company/integrations.blade.php',
    'resources/views/management/company/settings.blade.php',
    'resources/views/management/company/permissions.blade.php',
    'resources/views/management/admin/dashboard.blade.php',
    'resources/views/management/admin/integrations.blade.php',
    'resources/views/management/admin/registry.blade.php',
    'resources/views/management/admin/verticals.blade.php',
    'resources/views/management/admin/permissions.blade.php',
    'resources/views/management/admin/diagnostics.blade.php',
    'resources/views/management/admin/settings.blade.php',
    'resources/assets/js/titan-builder-management.js',
    'resources/assets/css/titan-builder-management.css',
];
foreach ($mustExist as $path) {
    if (! is_file($root.'/'.$path)) {
        $failures[] = 'missing '.$path;
    }
}

$provider = is_file($root.'/System/TitanBuilderServiceProvider.php') ? file_get_contents($root.'/System/TitanBuilderServiceProvider.php') : '';
foreach (["loadRoutesFrom(__DIR__.'/../routes/web.php')", "loadViewsFrom(__DIR__.'/../resources/views', 'titan-builder')", 'titan-builder-management.js', 'titan-builder-management.css'] as $needle) {
    if (! str_contains($provider, $needle)) $failures[] = 'provider missing '.$needle;
}
if (str_contains($provider, "'extension'")) $failures[] = 'generic extension publish tag present';

$web = is_file($root.'/routes/web.php') ? file_get_contents($root.'/routes/web.php') : '';
foreach (['titan-builder.manage.dashboard','titan-builder.manage.projects','titan-builder.manage.applications','titan-builder.admin.dashboard','titan-builder.admin.settings'] as $needle) {
    if (! str_contains($web, $needle)) $failures[] = 'web routes missing '.$needle;
}
if (! str_contains($web, "whereIn('surface', ['customer','field','owner','onboarding'])")) $failures[] = 'four application surfaces not constrained';

$manifest = json_decode((string) file_get_contents($root.'/extension.json'), true);
if (version_compare((string) ($manifest['version'] ?? '0.0.0'), '0.9.0', '<')) $failures[] = 'extension.json below v0.9.0 management UI floor';
$sidecar = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true);
if (version_compare((string) ($sidecar['version'] ?? '0.0.0'), '0.9.0', '<')) $failures[] = 'sidecar below v0.9.0 management UI floor';
if (! in_array('titan.builder.management-ui', (array)($sidecar['capabilities'] ?? []), true)) $failures[] = 'management capability missing';
if (! in_array('titan_builder_settings', (array)($sidecar['database']['owned_tables'] ?? []), true)) $failures[] = 'settings table not declared';

if ($web !== '' && preg_match('/tenant_id|forTenant|TenantContext|BelongsToTenant/', $web)) $failures[] = 'legacy tenant token in web routes';

if ($failures) {
    fwrite(STDERR, "Management UI v0.9 contract: FAIL\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

echo "Management UI v0.9 contract: PASS\n";
