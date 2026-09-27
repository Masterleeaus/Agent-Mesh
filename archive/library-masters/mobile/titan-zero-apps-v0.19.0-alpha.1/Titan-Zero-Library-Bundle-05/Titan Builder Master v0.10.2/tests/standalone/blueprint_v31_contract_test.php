<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$assert = static function (bool $ok, string $message) use (&$failures): void {
    if (! $ok) {
        $failures[] = $message;
    }
};

$installerPath = $root.'/extension.json';
$sidecarPath = $root.'/extension.manifest.json';
$assert(is_file($sidecarPath), 'extension.manifest.json must exist');

$installer = json_decode((string) file_get_contents($installerPath), true);
$assert(is_array($installer), 'extension.json must parse');
if (is_array($installer)) {
    $assert(($installer['schema'] ?? null) === 'titan-extension-v1', 'extension.json must use the current Titan installer schema');
    $assert(($installer['slug'] ?? null) === 'titan-builder', 'installer slug must be titan-builder');
    $assert(($installer['folder'] ?? null) === 'TitanBuilder', 'installer folder must be TitanBuilder');
    $assert(($installer['provider'] ?? null) === 'App\\Extensions\\TitanBuilder\\System\\TitanBuilderServiceProvider', 'installer provider mismatch');
    $assert(version_compare((string) ($installer['version'] ?? '0.0.0'), '0.7.0', '>='), 'installer version must retain v0.7+ compatibility');
}

$sidecar = is_file($sidecarPath) ? json_decode((string) file_get_contents($sidecarPath), true) : null;
$assert(is_array($sidecar), 'extension.manifest.json must parse');
if (is_array($sidecar)) {
    $assert(($sidecar['key'] ?? null) === 'titan-builder', 'sidecar key must be titan-builder');
    $assert(($sidecar['folder'] ?? null) === 'TitanBuilder', 'sidecar folder must be TitanBuilder');
    $assert(($sidecar['namespace'] ?? null) === 'App\\Extensions\\TitanBuilder', 'sidecar namespace mismatch');
    $assert(($sidecar['provider'] ?? null) === 'App\\Extensions\\TitanBuilder\\System\\TitanBuilderServiceProvider', 'sidecar provider mismatch');
    $assert(($sidecar['family'] ?? null) === 'native', 'Titan Builder must be a native extension family');
    $assert(($sidecar['data']['tenant_key'] ?? null) === 'company_id', 'tenant key must be company_id');
    $assert(($sidecar['data']['default_uninstall_policy'] ?? null) === 'retain', 'uninstall data policy must retain company data');
    $assert(($sidecar['lifecycle']['register_key'] ?? null) === true, 'register_key lifecycle must be enabled');
    $assert(($sidecar['lifecycle']['uninstall'] ?? null) === true, 'uninstall lifecycle must be enabled');
    $assert(($sidecar['lifecycle']['idempotent'] ?? null) === true, 'uninstall lifecycle must be idempotent');
    $owned = $sidecar['database']['owned_tables'] ?? [];
    foreach ([
        'titan_builder_projects', 'titan_builder_versions', 'titan_builder_pages',
        'titan_builder_page_specs', 'titan_builder_themes', 'titan_builder_templates',
        'titan_builder_assets', 'titan_builder_publish_snapshots', 'titan_builder_ai_generation_jobs',
    ] as $table) {
        $assert(in_array($table, $owned, true), "sidecar must declare owned table {$table}");
    }
}

$provider = (string) file_get_contents($root.'/System/TitanBuilderServiceProvider.php');
$assert(str_contains($provider, 'ExtensionRegisterKeyProviderInterface'), 'provider must implement registration-key interface');
$assert(str_contains($provider, 'UninstallExtensionServiceProviderInterface'), 'provider must implement uninstall interface');
$assert(str_contains($provider, "return 'titan-builder';"), 'provider registerKey() must return titan-builder');
$assert(! str_contains($provider, "publishes(\$extensionPublishables, 'extension')"), 'provider must not publish with generic extension tag');
$assert(str_contains($provider, "publishes(\$extensionPublishables, 'titan-builder')"), 'provider must publish with titan-builder tag');
$assert(str_contains($provider, 'public static function uninstall(): void'), 'provider must expose static uninstall()');
$assert(! str_contains($provider, "Schema::drop"), 'provider uninstall must not drop retained company tables');

$migration = (string) file_get_contents($root.'/database/migrations/2026_08_09_000100_create_titan_builder_tables.php');
foreach ([
    'titan_builder_projects', 'titan_builder_versions', 'titan_builder_pages',
    'titan_builder_page_specs', 'titan_builder_themes', 'titan_builder_templates',
    'titan_builder_assets', 'titan_builder_publish_snapshots', 'titan_builder_ai_generation_jobs',
] as $table) {
    $assert(str_contains($migration, "Schema::hasTable('{$table}')"), "migration up() must guard {$table}");
}

if ($failures !== []) {
    fwrite(STDERR, "FAILED blueprint_v31_contract_test\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

echo "PASS blueprint_v31_contract_test\n";
