<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$assert = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) {
        $failures[] = $message;
    }
};

$extension = json_decode((string) file_get_contents($root.'/extension.json'), true);
$manifest = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true);
$assert(is_array($manifest), 'extension.manifest.json must parse');
$assert(($manifest['key'] ?? null) === 'titan-builder', 'extension key must remain titan-builder');
$assert(($manifest['provider'] ?? null) === 'App\\Extensions\\TitanBuilder\\System\\TitanBuilderServiceProvider', 'provider identity changed');
$assert(($manifest['folder'] ?? null) === 'TitanBuilder', 'extension folder identity changed');
$assert(($extension['version'] ?? null) === ($manifest['version'] ?? null), 'legacy/sidecar versions differ');

$expectedContracts = [
    'ComponentRegistry', 'TemplateRegistry', 'ThemeRegistry', 'PageRepository', 'PreviewRenderer',
    'Publisher', 'ActionCatalog', 'DataSourceCatalog', 'AiUiGenerator', 'SurfaceRegistry', 'VerticalContextProvider',
];
foreach ($expectedContracts as $contract) {
    $assert(is_file($root.'/System/Contracts/'.$contract.'.php'), "missing contract {$contract}");
}

$assert(is_dir($root.'/database/migrations'), 'missing Titan Builder migrations');
$assert(count(glob($root.'/database/migrations/*.php') ?: []) >= 2, 'company-boundary upgrade migration is missing');
$assert(is_file($root.'/System/Security/CompanyContext.php'), 'CompanyContext is missing');
$assert(is_file($root.'/System/Models/Concerns/BelongsToCompany.php'), 'BelongsToCompany is missing');
$assert(is_file($root.'/database/migrations/2026_08_09_000200_migrate_titan_builder_to_company_boundary.php'), 'company-boundary bridge migration is missing');

foreach (['customer', 'field', 'owner'] as $surface) {
    $assert(is_file($root.'/resources/builder/surfaces/'.$surface.'.json'), "missing {$surface} surface contract");
    $assert(is_file($root.'/resources/builder/templates/'.$surface.'.json'), "missing {$surface} template");
}

$verticals = [
    'cleaning', 'plumbing', 'electrical', 'hvac', 'handyman-property-maintenance',
    'landscaping-gardening', 'pest-control', 'locksmith-security', 'roofing-guttering', 'appliance-equipment-repair',
];
foreach ($verticals as $vertical) {
    $assert(is_file($root.'/resources/builder/verticals/'.$vertical.'.json'), "missing vertical overlay {$vertical}");
}

$activeRoots = [$root.'/System', $root.'/config', $root.'/routes'];
foreach ($activeRoots as $activeRoot) {
    if (! is_dir($activeRoot)) {
        continue;
    }
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($activeRoot, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if (! $file->isFile()) {
            continue;
        }
        $contents = (string) file_get_contents($file->getPathname());
        $relative = substr($file->getPathname(), strlen($root) + 1);
        $assert(! str_contains($contents, 'App\\Extensions\\Chatbot'), "active Chatbot namespace coupling in {$relative}");
        $assert(! str_contains($contents, "config('chatbot."), "active Chatbot config coupling in {$relative}");
    }
}

$provider = (string) file_get_contents($root.'/System/TitanBuilderServiceProvider.php');
$assert(str_contains($provider, 'loadMigrationsFrom'), 'provider does not load Titan Builder migrations');
$assert(! str_contains($provider, 'donor/chatbot-coupled'), 'provider must never auto-load donor Chatbot files');

$jsonFiles = [];
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/resources/builder', FilesystemIterator::SKIP_DOTS));
foreach ($iterator as $file) {
    if ($file->isFile() && strtolower($file->getExtension()) === 'json') {
        $jsonFiles[] = $file->getPathname();
        json_decode((string) file_get_contents($file->getPathname()), true);
        $assert(json_last_error() === JSON_ERROR_NONE, 'invalid JSON: '.substr($file->getPathname(), strlen($root) + 1));
    }
}
$assert(count($jsonFiles) > 100, 'builder resource library unexpectedly small');

if ($failures !== []) {
    fwrite(STDERR, "FAILED\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

echo "PASS package_contract (".count($jsonFiles)." JSON resources)\n";
