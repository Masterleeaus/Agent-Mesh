<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$assert = static function (bool $ok, string $message) use (&$failures): void {
    if (! $ok) { $failures[] = $message; }
};

$manifestPath = $root.'/extension.json';
$assert(is_file($manifestPath), 'root extension.json is required');
$manifest = is_file($manifestPath) ? json_decode((string) file_get_contents($manifestPath), true) : null;
$assert(is_array($manifest), 'extension.json must parse as JSON');

if (is_array($manifest)) {
    $assert(($manifest['schema'] ?? null) === 'titan-extension-v1', 'schema must be titan-extension-v1');
    $assert(($manifest['slug'] ?? null) === 'titan-builder', 'slug must be titan-builder');
    $assert(($manifest['folder'] ?? null) === 'TitanBuilder', 'folder must be TitanBuilder');
    $assert(($manifest['provider'] ?? null) === 'App\\Extensions\\TitanBuilder\\System\\TitanBuilderServiceProvider', 'provider must match TitanBuilder provider');
    $assert(($manifest['migrations'] ?? null) === true, 'migrations must be enabled');
    $assert((bool) preg_match('/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/', (string) ($manifest['version'] ?? '')), 'version must be full semver');
    $assert(is_array($manifest['requires'] ?? null), 'requires must be declared');
    $assert(is_array($manifest['integrity'] ?? null) && $manifest['integrity'] !== [], 'production integrity map must be declared');
    $assert(in_array('titan-builder', (array) ($manifest['publish_tags'] ?? []), true), 'titan-builder publish tag must be declared');
}

$providerPath = $root.'/System/TitanBuilderServiceProvider.php';
$assert(is_file($providerPath), 'provider file must exist at System/TitanBuilderServiceProvider.php');
$provider = is_file($providerPath) ? (string) file_get_contents($providerPath) : '';
$assert(str_contains($provider, 'namespace App\\Extensions\\TitanBuilder\\System;'), 'provider namespace must match manifest');
$assert(str_contains($provider, 'class TitanBuilderServiceProvider extends ServiceProvider'), 'provider class must match manifest');
$assert(! str_contains($provider, "publishes(\$extensionPublishables, 'extension')"), 'generic extension publish tag must not be used');
$assert(str_contains($provider, "publishes(\$extensionPublishables, 'titan-builder')"), 'extension-specific titan-builder publish tag is required');

if (is_array($manifest['integrity'] ?? null)) {
    $integrity = $manifest['integrity'];
    $algorithm = (string) ($integrity['algorithm'] ?? 'sha256');
    $entries = isset($integrity['files']) && is_array($integrity['files'])
        ? $integrity['files']
        : $integrity;

    $assert($algorithm === 'sha256', 'integrity algorithm must be sha256');
    foreach ($entries as $relative => $expected) {
        $assert(is_string($relative) && $relative !== '' && ! str_contains($relative, '\\') && ! str_starts_with($relative, '/') && ! str_contains($relative, '../'), "unsafe integrity path: {$relative}");
        $path = $root.'/'.$relative;
        $assert(is_file($path), "integrity file missing: {$relative}");
        if (is_file($path)) {
            $actualRaw = hash_file('sha256', $path);
            $expectedRaw = str_starts_with((string) $expected, 'sha256:') ? substr((string) $expected, 7) : (string) $expected;
            $assert(hash_equals($expectedRaw, $actualRaw), "integrity mismatch: {$relative}");
        }
    }
}

$junk = [];
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
foreach ($it as $file) {
    $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
    if (str_starts_with($relative, '__MACOSX/') || str_contains($relative, '/.git/') || str_contains($relative, '/node_modules/') || basename($relative) === '.DS_Store' || basename($relative) === '.env') {
        $junk[] = $relative;
    }
}
$assert($junk === [], 'package contains junk files: '.implode(', ', $junk));

if ($failures !== []) {
    fwrite(STDERR, "Current installer contract FAILED:\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

echo "Current installer contract: PASS\n";
