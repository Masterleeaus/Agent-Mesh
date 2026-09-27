<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$assert = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) {
        $failures[] = $message;
    }
};

$migration = $root.'/database/migrations/2026_08_09_000400_register_titan_builder_menus.php';
$assert(is_file($migration), 'menu migration missing');
$migrationBody = is_file($migration) ? (string) file_get_contents($migration) : '';

$assert(str_contains($migrationBody, "Schema::hasTable('menus')"), 'menu migration must fail safely when menus table is unavailable');
$assert(str_contains($migrationBody, "DB::table('menus')->updateOrInsert"), 'menu registration must be idempotent via updateOrInsert');
$assert(str_contains($migrationBody, "'titan_builder'"), 'user Titan Builder parent menu key missing');
$assert(str_contains($migrationBody, "'titan_builder_admin'"), 'admin Titan Builder parent menu key missing');

$userKeys = [
    'titan_builder_overview', 'titan_builder_projects', 'titan_builder_applications',
    'titan_builder_hub', 'titan_builder_go', 'titan_builder_command', 'titan_builder_onboarding',
    'titan_builder_assets', 'titan_builder_brand', 'titan_builder_integrations',
    'titan_builder_permissions', 'titan_builder_settings',
];
$adminKeys = [
    'titan_builder_admin_overview', 'titan_builder_admin_integrations', 'titan_builder_admin_registry',
    'titan_builder_admin_verticals', 'titan_builder_admin_permissions', 'titan_builder_admin_diagnostics',
    'titan_builder_admin_settings',
];
foreach (array_merge($userKeys, $adminKeys) as $key) {
    $assert(str_contains($migrationBody, "'{$key}'"), "menu key missing: {$key}");
}
$assert(str_contains($migrationBody, "whereIn('key'"), 'down migration must remove only Titan Builder menu keys');

$routes = (string) file_get_contents($root.'/routes/web.php');
$routeNames = [
    'titan-builder.manage.application.hub',
    'titan-builder.manage.application.go',
    'titan-builder.manage.application.command',
    'titan-builder.manage.application.onboarding',
];
foreach ($routeNames as $routeName) {
    $assert(str_contains($routes, "name('{$routeName}')"), "fixed application route missing: {$routeName}");
}

$manifest = json_decode((string) file_get_contents($root.'/extension.json'), true, 512, JSON_THROW_ON_ERROR);
$assert(version_compare((string) ($manifest['version'] ?? '0.0.0'), '0.9.1', '>='), 'extension.json must preserve the v0.9.1 menu-registration capability floor');
$provider = (string) file_get_contents($root.'/System/TitanBuilderServiceProvider.php');
$assert(str_contains($provider, "Schema::hasTable('menus')"), 'uninstall must guard shared menus table');
$assert(str_contains($provider, "where('key', 'titan_builder')"), 'uninstall must target Titan Builder user menu parent');
$assert(str_contains($provider, "orWhere('key', 'like', 'titan_builder_%')"), 'uninstall must remove Titan Builder child/admin menu keys');

$sidecar = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true, 512, JSON_THROW_ON_ERROR);
$assert(version_compare((string) ($sidecar['extension']['version'] ?? $sidecar['version'] ?? '0.0.0'), '0.9.1', '>='), 'sidecar must preserve the v0.9.1 menu-registration capability floor');

if ($failures !== []) {
    fwrite(STDERR, "Titan Builder menu registration v0.9.1: FAIL\n- ".implode("\n- ", $failures)."\n");
    exit(1);
}

echo "Titan Builder menu registration v0.9.1: PASS\n";
