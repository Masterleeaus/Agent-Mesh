<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (!$condition) {
        $failures[] = $message;
    }
};

$check(is_file($root . '/System/InteractionEngineServiceProvider.php'), 'MagicAI-native provider is missing');
$check(is_file($root . '/extension.manifest.json'), 'Hardened extension.manifest.json is missing');
$check(is_file($root . '/config/interaction-engine.php'), 'Collision-safe extension config is missing');
$check(is_file($root . '/routes/user.php'), 'MagicAI user route profile is missing');
$check(is_file($root . '/routes/admin.php'), 'MagicAI admin route profile is missing');
$check(is_file($root . '/routes/api.php'), 'Versioned API route profile is missing');

if (is_file($root . '/extension.json')) {
    $installerManifest = json_decode((string) file_get_contents($root . '/extension.json'), true);
    $check(is_array($installerManifest), 'extension.json must be valid JSON');
    $check(($installerManifest['schema'] ?? null) === 'titan-extension-v1', 'extension.json must use titan-extension-v1');
    $check(($installerManifest['slug'] ?? null) === 'titan-interaction-engine', 'extension slug must be titan-interaction-engine');
    $check(($installerManifest['version'] ?? null) === '10.12.0', 'extension.json version must match the v10.12.0 release');
    $check(($installerManifest['folder'] ?? null) === 'InteractionEngine', 'extension folder must be InteractionEngine');
    $check(($installerManifest['provider'] ?? null) === 'App\\Extensions\\InteractionEngine\\System\\InteractionEngineServiceProvider', 'extension provider must match the installed provider');
    $check(($installerManifest['migrations'] ?? null) === true, 'extension must declare migrations=true');
    $check(($installerManifest['requires']['php'] ?? null) === '>=8.2', 'extension must require PHP >=8.2');
    $check(($installerManifest['requires']['magicai'] ?? null) === '>=10.91', 'extension must require MagicAI >=10.91');
    $check(($installerManifest['requires']['titan_platform'] ?? null) === '>=1.0', 'extension must require Titan Platform >=1.0');
    $check(isset($installerManifest['integrity']) && is_array($installerManifest['integrity']) && $installerManifest['integrity'] !== [], 'production installer manifest must contain integrity hashes');
    $check(preg_match('/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/', (string) ($installerManifest['version'] ?? '')) === 1, 'extension version must be full semantic version');
}

if (is_file($root . '/extension.manifest.json')) {
    $manifest = json_decode((string) file_get_contents($root . '/extension.manifest.json'), true);
    $check(is_array($manifest), 'extension.manifest.json must be valid JSON');
    $check(($manifest['key'] ?? null) === 'interaction-engine', 'registration key must be interaction-engine');
    $check(($manifest['folder'] ?? null) === 'InteractionEngine', 'manifest folder must be InteractionEngine');
    $check(($manifest['provider'] ?? null) === 'App\\Extensions\\InteractionEngine\\System\\InteractionEngineServiceProvider', 'manifest provider must be MagicAI-native');
    $check(($manifest['data']['default_uninstall_policy'] ?? null) === 'retain', 'default uninstall policy must retain tenant data');
}

if (is_file($root . '/System/InteractionEngineServiceProvider.php')) {
    $provider = (string) file_get_contents($root . '/System/InteractionEngineServiceProvider.php');
    $check(str_contains($provider, 'namespace App\\Extensions\\InteractionEngine\\System;'), 'provider namespace is not MagicAI-native');
    $check(str_contains($provider, 'ExtensionRegisterKeyProviderInterface'), 'provider does not implement MagicAI registration-key interface');
    $check(str_contains($provider, 'UninstallExtensionServiceProviderInterface'), 'provider does not implement MagicAI uninstall interface');
    $check(str_contains($provider, "return 'interaction-engine';"), 'provider registration key is missing');
    $check(str_contains($provider, 'public static function uninstall(): void'), 'provider idempotent uninstall hook is missing');
    $check(!str_contains($provider, "], 'extension');"), 'provider must not use the generic extension publish tag');
    $check(str_contains($provider, "interaction-engine-config"), 'provider must use an extension-specific publish tag');
    $check(!str_contains($provider, "->user()"), 'provider must not resolve authenticated user state during registration');
    $check(!str_contains($provider, "config('interaction.wizard.default_company_id', 'default')"), 'provider must not fall back to a default tenant');
}

$sourceFiles = [];
if (is_dir($root . '/System')) {
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/System', FilesystemIterator::SKIP_DOTS));
    foreach ($it as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $sourceFiles[] = $file->getPathname();
        }
    }
}
foreach ($sourceFiles as $file) {
    $contents = (string) file_get_contents($file);
    $check(!str_contains($contents, 'namespace TitanZero\\Interaction'), 'legacy Interaction namespace remains in ' . $file);
    $check(!str_contains($contents, 'namespace TitanZero\\Engines'), 'legacy Engines namespace remains in ' . $file);
    $check(!str_contains($contents, "base_path('interactions"), 'generic root interaction path remains in ' . $file);
    $check(!str_contains($contents, "base_path('wizards"), 'generic root wizard path remains in ' . $file);
    $check(!str_contains($contents, "base_path('templates"), 'generic root template path remains in ' . $file);
}

$check(!is_dir($root . '/System/Extensions/TitanZeroMultiVertical'), 'nested TitanZeroMultiVertical extension must not ship');

$config = is_file($root . '/config/interaction-engine.php') ? (string) file_get_contents($root . '/config/interaction-engine.php') : '';
$check(!str_contains($config, "base_path('interactions')"), 'definitions must use extension-owned paths');
$check(!str_contains($config, "base_path('wizards')"), 'wizards must use extension-owned paths');
$check(!str_contains($config, "base_path('templates')"), 'templates must use extension-owned paths');
$check(!str_contains($config, "'change-me'"), 'insecure outbox secret fallback remains');
$check(!str_contains($config, "'change-this-approval-secret'"), 'insecure approval secret fallback remains');


$freshRunMigration = $root . '/database/migrations/2026_08_01_000000_create_interaction_runs_table.php';
$check(is_file($freshRunMigration) && str_contains((string) file_get_contents($freshRunMigration), "string('company_id'"), 'fresh interaction_runs schema must create company_id directly');
$runModel = $root . '/System/Models/InteractionRun.php';
if (is_file($runModel)) {
    $runModelSource = (string) file_get_contents($runModel);
    $check(str_contains($runModelSource, "'company_id'"), 'interaction run model is not tenant-aware');
}

$answerRepo = $root . '/System/Repositories/EloquentInteractionAnswerRepository.php';
if (is_file($answerRepo)) {
    $answerSource = (string) file_get_contents($answerRepo);
    $check(!str_contains($answerSource, 'json_encode($answer->value)'), 'answer repository must not double-encode JSON-cast values');
    $check(!str_contains($answerSource, 'json_decode($record->value, true)'), 'answer repository must not manually decode JSON-cast values');
}

$runRepo = $root . '/System/Repositories/InteractionRunRepositoryInterface.php';
if (is_file($runRepo)) {
    $runRepoSource = (string) file_get_contents($runRepo);
    $check(str_contains($runRepoSource, 'findForActor'), 'interaction-run repository lacks actor-scoped lookup');
}

$controller = $root . '/System/Http/Controllers/InteractionController.php';
if (is_file($controller)) {
    $controllerSource = (string) file_get_contents($controller);
    $check(!str_contains($controllerSource, '$this->runtime->load($runId)'), 'controller still performs unscoped run lookup');
}

if ($failures !== []) {
    fwrite(STDERR, "Phase 1 extensionization checks failed:\n - " . implode("\n - ", $failures) . "\n");
    exit(1);
}

echo "Phase 1 extensionization checks passed\n";
