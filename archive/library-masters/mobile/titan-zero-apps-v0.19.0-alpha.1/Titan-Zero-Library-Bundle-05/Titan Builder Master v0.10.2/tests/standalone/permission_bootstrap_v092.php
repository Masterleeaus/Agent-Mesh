<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$assert = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) $failures[] = $message;
};

$migration = $root.'/database/migrations/2026_08_10_000500_register_titan_builder_permissions.php';
$assert(is_file($migration), 'Missing Builder permission bootstrap migration');
if (is_file($migration)) {
    $source = (string) file_get_contents($migration);
    foreach (['builder.read','builder.edit','builder.publish','builder.assets.manage','builder.templates.manage','builder.admin'] as $ability) {
        $assert(str_contains($source, "'{$ability}'"), 'Migration missing permission '.$ability);
    }
    foreach (['permissions','roles','role_has_permissions'] as $table) {
        $assert(str_contains($source, "Schema::hasTable('{$table}')"), 'Migration must guard shared table '.$table);
    }
    $assert(str_contains($source, "'user' =>"), 'Migration must define normal user defaults');
    $assert(str_contains($source, "'admin' =>"), 'Migration must define admin defaults');
    $assert(str_contains($source, "'super_admin' =>"), 'Migration must define super-admin defaults');
    $assert(str_contains($source, 'PermissionRegistrar'), 'Migration must clear Spatie permission cache when available');
}

$authPath = $root.'/System/Security/BuilderAuthorization.php';
$assert(is_file($authPath), 'Missing BuilderAuthorization');
if (is_file($authPath)) {
    $source = (string) file_get_contents($authPath);
    $assert(str_contains($source, 'legacyActorDefaults'), 'BuilderAuthorization must include legacy actor compatibility mapping');
    foreach (['builder.read','builder.edit','builder.publish','builder.assets.manage','builder.templates.manage','builder.admin'] as $ability) {
        $assert(str_contains($source, "'{$ability}'"), 'Authorization fallback missing '.$ability);
    }
    $assert(str_contains($source, "'user' =>"), 'Authorization fallback must recognize user actor type');
    $assert(str_contains($source, "'admin' =>"), 'Authorization fallback must recognize admin actor type');
    $assert(str_contains($source, "'super_admin' =>"), 'Authorization fallback must recognize super_admin actor type');
    $assert(! preg_match('/input\(|query\(|route\(|company_id.*capab/i', $source), 'Authorization must not derive capability from request/company input');
}

$config = require $root.'/config/titan-builder.php';
$defaults = $config['authorization']['legacy_actor_defaults'] ?? [];
$assert(($config['authorization']['legacy_actor_fallback'] ?? null) === true, 'Legacy actor fallback must be explicit and enabled');
$assert(in_array('builder.read', $defaults['user'] ?? [], true), 'user default must include builder.read');
$assert(in_array('builder.edit', $defaults['user'] ?? [], true), 'user default must include builder.edit');
$assert(in_array('builder.publish', $defaults['user'] ?? [], true), 'user default must include builder.publish');
$assert(in_array('builder.assets.manage', $defaults['user'] ?? [], true), 'user default must include builder.assets.manage');
$assert(in_array('builder.templates.manage', $defaults['user'] ?? [], true), 'user default must include builder.templates.manage');
$assert(! in_array('builder.admin', $defaults['user'] ?? [], true), 'ordinary user must not receive builder.admin');
$assert(in_array('builder.admin', $defaults['admin'] ?? [], true), 'admin default must include builder.admin');
$assert(in_array('builder.admin', $defaults['super_admin'] ?? [], true), 'super_admin default must include builder.admin');

$sidecar = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true);
$shared = $sidecar['database']['shared_tables'] ?? [];
foreach (['menus','permissions','roles','role_has_permissions'] as $table) {
    $assert(in_array($table, $shared, true), 'Shared host table not declared: '.$table);
}


$providerPath = $root.'/System/TitanBuilderServiceProvider.php';
$provider = is_file($providerPath) ? (string) file_get_contents($providerPath) : '';
$assert(str_contains($provider, "Schema::hasTable('permissions')"), 'Uninstall must guard permissions table');
$assert(str_contains($provider, "Schema::hasTable('role_has_permissions')"), 'Uninstall must guard role_has_permissions table');
$assert(str_contains($provider, "whereIn('name', ['builder.read'"), 'Uninstall must target only Titan Builder permissions');

if ($failures !== []) {
    fwrite(STDERR, "FAILED\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

echo "PASS permission_bootstrap_v092\n";
