<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];
$assert = static function (bool $ok, string $message) use (&$failures): void {
    if (! $ok) {
        $failures[] = $message;
    }
};

foreach ([
    'extension.json', 'extension.manifest.json', 'README.md', 'AGENT_DEVELOPMENT_PROMPT.md',
    'System', 'config/titan-builder.php', 'database/migrations', 'routes/api.php', 'routes/web.php',
    'resources/builder', 'resources/views/management', 'resources/assets/js/titan-builder-management.js', 'resources/assets/css/titan-builder-management.css',
    'docs/BLUEPRINT-V3.1-COMPLIANCE.md', 'docs/COMPANY-ID-BOUNDARY.md', 'docs/MANAGEMENT-UI.md',
] as $required) {
    $assert(file_exists($root.'/'.$required), 'Missing '.$required);
}

$installer = json_decode((string) file_get_contents($root.'/extension.json'), true);
$sidecar = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true);
$assert(is_array($installer), 'Invalid extension.json');
$assert(is_array($sidecar), 'Invalid extension.manifest.json');

if (is_array($installer)) {
    $assert(($installer['schema'] ?? null) === 'titan-extension-v1', 'Installer manifest schema must be titan-extension-v1');
    $assert(($installer['slug'] ?? null) === 'titan-builder', 'Unexpected extension slug');
    $assert(($installer['name'] ?? null) === 'Titan Builder', 'Unexpected extension name');
    $assert(($installer['version'] ?? null) === '0.10.2', 'Unexpected extension version');
    $assert(($installer['folder'] ?? null) === 'TitanBuilder', 'Unexpected installer folder');
    $assert(($installer['provider'] ?? null) === 'App\\Extensions\\TitanBuilder\\System\\TitanBuilderServiceProvider', 'Unexpected installer provider');
    $assert(($installer['migrations'] ?? null) === true, 'Installer manifest must enable migrations');
    $assert((bool) preg_match('/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/', (string) ($installer['version'] ?? '')), 'Installer version must be full semver');
    $assert(is_array($installer['dependencies'] ?? null), 'Installer dependencies must be declared');
    $assert(is_array($installer['requires'] ?? null), 'Installer platform requirements must be declared');
    $assert(in_array('titan-builder', (array) ($installer['publish_tags'] ?? []), true), 'Installer must declare titan-builder publish tag');
    $assert(is_array($installer['integrity'] ?? null) && $installer['integrity'] !== [], 'Installer integrity map must be populated');
}

if (is_array($sidecar)) {
    $assert(($sidecar['key'] ?? null) === 'titan-builder', 'Unexpected extension key');
    $assert(($sidecar['name'] ?? null) === ($installer['name'] ?? null), 'Manifest names differ');
    $assert(($sidecar['version'] ?? null) === ($installer['version'] ?? null), 'Manifest versions differ');
    $assert(($sidecar['folder'] ?? null) === 'TitanBuilder', 'Unexpected extension folder');
    $assert(($sidecar['namespace'] ?? null) === 'App\\Extensions\\TitanBuilder', 'Unexpected namespace');
    $assert(($sidecar['provider'] ?? null) === 'App\\Extensions\\TitanBuilder\\System\\TitanBuilderServiceProvider', 'Unexpected provider');
    $assert(($sidecar['family'] ?? null) === 'native', 'Unexpected extension family');
    $assert(($sidecar['data']['tenant_key'] ?? null) === 'company_id', 'Unexpected tenant key');
    $assert(($sidecar['data']['default_uninstall_policy'] ?? null) === 'retain', 'Company data must be retained by default on uninstall');
    $assert(($sidecar['queues']['used'] ?? null) === false, 'Builder package must not claim an internal queue runtime');
    $assert(($sidecar['billing']['mode'] ?? null) === 'none', 'Builder package must not claim billing ownership');
}

$jsonCount = 0;
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/resources/builder', FilesystemIterator::SKIP_DOTS));
foreach ($iterator as $file) {
    if ($file->isFile() && strtolower($file->getExtension()) === 'json') {
        $jsonCount++;
        json_decode((string) file_get_contents($file->getPathname()), true);
        $assert(json_last_error() === JSON_ERROR_NONE, 'Invalid JSON: '.$file->getPathname());
    }
}

foreach (['customer', 'field', 'owner', 'onboarding'] as $surface) {
    $assert(is_file($root.'/resources/builder/surfaces/'.$surface.'.json'), 'Missing surface '.$surface);
    $assert(is_file($root.'/resources/builder/templates/'.$surface.'.json'), 'Missing template '.$surface);
}

$provider = (string) file_get_contents($root.'/System/TitanBuilderServiceProvider.php');
$assert(str_contains($provider, 'ExtensionRegisterKeyProviderInterface'), 'Provider does not implement registration-key interface');
$assert(str_contains($provider, 'UninstallExtensionServiceProviderInterface'), 'Provider does not implement uninstall interface');
$assert(str_contains($provider, "return 'titan-builder';"), 'Provider registration key mismatch');
$assert(! str_contains($provider, "publishes(\$extensionPublishables, 'extension')"), 'Provider must not publish the generic extension tag');
$assert(str_contains($provider, "publishes(\$extensionPublishables, 'titan-builder')"), 'Provider must publish the titan-builder tag');
$assert(str_contains($provider, "loadRoutesFrom(__DIR__.'/../routes/web.php')"), 'Provider must load management web routes');
$assert(str_contains($provider, "loadViewsFrom(__DIR__.'/../resources/views', 'titan-builder')"), 'Provider must load management views');
$assert(str_contains($provider, 'titan-builder-management.js'), 'Provider must publish management JavaScript');
$assert(str_contains($provider, 'titan-builder-management.css'), 'Provider must publish management CSS');
$assert(str_contains($provider, 'public static function uninstall(): void'), 'Provider is missing static uninstall()');
$assert(str_contains($provider, 'loadMigrationsFrom'), 'Provider does not load package migrations');
$assert(! str_contains($provider, 'donor/chatbot-coupled'), 'Provider references donor autoload path');
$assert(! str_contains($provider, 'Schema::drop'), 'Provider uninstall must not drop retained company data');

$migration = (string) file_get_contents($root.'/database/migrations/2026_08_09_000100_create_titan_builder_tables.php');
$assert(substr_count($migration, "unsignedBigInteger('company_id')") === 9, 'Fresh schema must create company_id on all nine Builder tables');
$assert(! str_contains($migration, "tenant_id"), 'Fresh schema must not create the legacy tenant boundary');
$menuMigrationPath = $root.'/database/migrations/2026_08_09_000400_register_titan_builder_menus.php';
$assert(is_file($menuMigrationPath), 'Missing v0.9.1 MagicAI menu registration migration');
if (is_file($menuMigrationPath)) {
    $menuMigration = (string) file_get_contents($menuMigrationPath);
    $assert(str_contains($menuMigration, "Schema::hasTable('menus')"), 'Menu migration must guard the shared menus table');
    $assert(str_contains($menuMigration, "DB::table('menus')->updateOrInsert"), 'Menu migration must be idempotent');
    $assert(str_contains($menuMigration, "'titan_builder'"), 'User Titan Builder menu parent missing');
    $assert(str_contains($menuMigration, "'titan_builder_admin'"), 'Admin Titan Builder menu parent missing');
}
$assert(in_array('menus', (array) ($sidecar['database']['shared_tables'] ?? []), true), 'menus must be declared as a shared host table');

$permissionMigrationPath = $root.'/database/migrations/2026_08_10_000500_register_titan_builder_permissions.php';
$assert(is_file($permissionMigrationPath), 'Missing v0.9.2 Builder permission bootstrap migration');
if (is_file($permissionMigrationPath)) {
    $permissionMigration = (string) file_get_contents($permissionMigrationPath);
    foreach (['builder.read','builder.edit','builder.publish','builder.assets.manage','builder.templates.manage','builder.admin'] as $ability) {
        $assert(str_contains($permissionMigration, "'{$ability}'"), 'Permission migration missing '.$ability);
    }
    $assert(str_contains($permissionMigration, "Schema::hasTable('permissions')"), 'Permission migration must guard permissions table');
    $assert(str_contains($permissionMigration, "Schema::hasTable('roles')"), 'Permission migration must guard roles table');
    $assert(str_contains($permissionMigration, "Schema::hasTable('role_has_permissions')"), 'Permission migration must guard role_has_permissions table');
}
foreach (['permissions','roles','role_has_permissions'] as $sharedPermissionTable) {
    $assert(in_array($sharedPermissionTable, (array) ($sidecar['database']['shared_tables'] ?? []), true), $sharedPermissionTable.' must be declared as a shared host table');
}

$bridgePath = $root.'/database/migrations/2026_08_09_000200_migrate_titan_builder_to_company_boundary.php';
$assert(is_file($bridgePath), 'Missing v0.3 to v0.4 company-boundary migration');
if (is_file($bridgePath)) {
    $bridge = (string) file_get_contents($bridgePath);
    $assert(str_contains($bridge, "whereNull('company_id')->count()"), 'Bridge must detect unresolved company mappings');
    $assert(str_contains($bridge, "dropColumn('tenant_id')"), 'Bridge must remove tenant_id after successful mapping');
}

foreach ([$root.'/System', $root.'/routes', $root.'/config'] as $activeRoot) {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($activeRoot, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if (! $file->isFile()) {
            continue;
        }
        $contents = (string) file_get_contents($file->getPathname());
        foreach (['tenant_id', 'TenantContext', 'BelongsToTenant', 'forTenant('] as $legacyBoundary) {
            $assert(! str_contains($contents, $legacyBoundary), 'Active runtime contains legacy boundary '.$legacyBoundary.': '.$file->getPathname());
        }
    }
}
$migrationSources = '';
foreach (glob($root.'/database/migrations/*.php') ?: [] as $migrationFile) {
    $migrationSources .= "\n".(string) file_get_contents($migrationFile);
}
foreach (($sidecar['database']['owned_tables'] ?? []) as $table) {
    $assert(str_contains($migrationSources, "Schema::hasTable('{$table}')"), 'Migration is not schema-idempotent for '.$table);
    $assert(str_contains($migrationSources, "Schema::create('{$table}'"), 'Owned table is not created by package migrations: '.$table);
}

if ($failures !== []) {
    fwrite(STDERR, "FAILED\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

if (is_array($installer['integrity'] ?? null)) {
    $integrity = $installer['integrity'];
    $algorithm = (string) ($integrity['algorithm'] ?? 'sha256');
    $files = $integrity['files'] ?? $integrity;
    $assert($algorithm === 'sha256', 'Unsupported integrity algorithm: '.$algorithm);
    $assert(is_array($files), 'Installer integrity files map must be populated');
    if (is_array($files)) {
        foreach ($files as $relative => $expected) {
            $assert(is_string($relative) && $relative !== '' && ! str_contains($relative, '\\') && ! str_starts_with($relative, '/') && ! str_contains($relative, '../'), 'Unsafe integrity path: '.$relative);
            $path = $root.'/'.$relative;
            $assert(is_file($path), 'Missing integrity file: '.$relative);
            if (is_file($path)) {
                $expectedHash = preg_replace('/^sha256:/', '', (string) $expected);
                $assert(hash_equals((string) $expectedHash, hash_file('sha256', $path)), 'Integrity mismatch: '.$relative);
            }
        }
    }
}

if ($failures !== []) {
    fwrite(STDERR, "FAILED\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

echo 'OK TitanBuilder '.$installer['version'].' | Titan installer v1 + Blueprint sidecar | JSON resources: '.$jsonCount.PHP_EOL;
