<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (!$condition) $failures[] = $message;
};

$commands = glob($root . '/System/Commands/*Command.php') ?: [];
foreach ($commands as $file) {
    $source = file_get_contents($file) ?: '';
    if (str_contains($source, 'protected $signature')) {
        $check(!str_contains($source, "= 'interaction:"), basename($file) . ' still uses the legacy interaction: command namespace.');
    }
}

$install = file_get_contents($root . '/System/Commands/InstallCommand.php') ?: '';
$check(str_contains($install, 'App\\Extensions\\InteractionEngine\\System\\InteractionEngineServiceProvider'), 'Installer must publish through the MagicAI-native provider.');
$check(!str_contains($install, 'TitanZero\\Interaction'), 'Installer still references removed TitanZero provider.');
$check(str_contains($install, "'--tag' => 'extension'"), 'Installer must use the provider extension publish tag.');

$seed = file_get_contents($root . '/System/Commands/SeedCommand.php') ?: '';
$check(str_contains($seed, 'realpath($source)'), 'Seed command must detect source==destination and avoid self-copy.');


$check(is_file($root . '/System/Contracts/InteractionEngineManagerContract.php'), 'InteractionEngineManagerContract is missing.');
$check(is_file($root . '/System/Http/Middleware/EnsureInteractionEngineEnabled.php'), 'Runtime disable middleware is missing.');
$provider = file_get_contents($root . '/System/InteractionEngineServiceProvider.php') ?: '';
$check(str_contains($provider, 'EnsureInteractionEngineEnabled::class'), 'User/API route profiles are not disable-gated.');
$check(str_contains($provider, "storage_path('app/interaction-engine')"), 'Uninstall does not clean extension-owned storage path.');
$check(str_contains($provider, "public_path('vendor/interaction-engine')"), 'Uninstall does not clean extension-owned public path.');
$health = file_get_contents($root . '/System/Monitoring/HealthCheck.php') ?: '';
$check(str_contains($health, 'company_id'), 'Health diagnostics do not verify the company_id tenancy contract.');
$commandBus = file_get_contents($root . '/System/Command/CommandBus.php') ?: '';
$check(str_contains($commandBus, 'ExtensionState'), 'CommandBus does not enforce extension disable state outside HTTP routes.');

if ($failures !== []) {
    fwrite(STDERR, "Phase 3 CLI/lifecycle checks failed:\n - " . implode("\n - ", $failures) . "\n");
    exit(1);
}

echo "Phase 3 CLI/lifecycle checks passed.\n";
