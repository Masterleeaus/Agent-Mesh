<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];

$decode = static function (string $path) use (&$errors): array {
    if (! is_file($path)) {
        $errors[] = basename($path).' is missing';
        return [];
    }

    try {
        $decoded = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        $errors[] = basename($path).': '.$exception->getMessage();
        return [];
    }

    if (! is_array($decoded)) {
        $errors[] = basename($path).' root must be an object';
        return [];
    }

    return $decoded;
};

$installer = $decode($root.'/extension.json');
$sidecar = $decode($root.'/extension.manifest.json');

$requiredInstallerFields = ['schema', 'slug', 'version', 'folder', 'provider', 'requires', 'migrations', 'uninstall', 'integrity'];
foreach ($requiredInstallerFields as $field) {
    if (! array_key_exists($field, $installer)) {
        $errors[] = "extension.json is missing required Titan installer field: {$field}";
    }
}
if (($installer['schema'] ?? null) !== 'titan-extension-v1') {
    $errors[] = "extension.json schema must be titan-extension-v1";
}
if (($installer['slug'] ?? null) !== 'titan-maps-intelligence') {
    $errors[] = 'extension.json slug must be titan-maps-intelligence';
}
if (($installer['folder'] ?? null) !== 'TitanMapsIntelligence') {
    $errors[] = 'extension.json folder must be TitanMapsIntelligence';
}
if (($installer['provider'] ?? null) !== 'App\\Extensions\\TitanMapsIntelligence\\System\\TitanMapsIntelligenceServiceProvider') {
    $errors[] = 'extension.json provider does not match the canonical service provider';
}
if (($installer['migrations'] ?? null) !== true) {
    $errors[] = 'extension.json migrations must be true';
}
foreach (['version'] as $field) {
    if (($installer[$field] ?? null) !== ($sidecar[$field] ?? null)) {
        $errors[] = "manifest {$field} values differ";
    }
}
if (($installer['slug'] ?? null) !== ($sidecar['key'] ?? null)) {
    $errors[] = 'extension.json slug and sidecar key differ';
}
if (($installer['folder'] ?? null) !== ($sidecar['folder'] ?? null)) {
    $errors[] = 'extension.json folder and sidecar folder differ';
}
if (($installer['provider'] ?? null) !== ($sidecar['provider'] ?? null)) {
    $errors[] = 'extension.json provider and sidecar provider differ';
}
if (($installer['migrations'] ?? false) !== ($sidecar['database']['migrations'] ?? false)) {
    $errors[] = 'extension.json migrations and sidecar database.migrations differ';
}

$provider = (string) ($installer['provider'] ?? '');
$namespace = (string) ($sidecar['namespace'] ?? '');
if ($provider === '' || ! str_starts_with($provider, $namespace.'\\')) {
    $errors[] = 'provider is outside declared namespace';
} else {
    $relative = substr($provider, strlen($namespace) + 1);
    $providerFile = $root.'/'.str_replace('\\', '/', $relative).'.php';
    if (! is_file($providerFile)) {
        $errors[] = 'declared provider file is missing: '.str_replace($root.'/', '', $providerFile);
    }
}

if (($sidecar['queues']['used'] ?? false) === true) {
    if (($sidecar['queues']['tenant_context_required'] ?? false) !== true) {
        $errors[] = 'queued extensions must require tenant context';
    }
    if (($sidecar['queues']['queue_names'] ?? []) === []) {
        $errors[] = 'queued extensions must declare queue names';
    }
}

if (($installer['migrations'] ?? false) === true && ! is_dir($root.'/database/migrations')) {
    $errors[] = 'migrations are declared but database/migrations is missing';
}

if ($errors !== []) {
    foreach ($errors as $error) {
        fwrite(STDERR, "ERROR: {$error}\n");
    }
    exit(1);
}

echo 'OK: Titan Extension Manager manifest contract '.$installer['version'].PHP_EOL;
