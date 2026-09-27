<?php

declare(strict_types=1);

$root = dirname(__DIR__);
require_once $root.'/System/Workforce/WorkforceIntegrationContract.php';

use App\Extensions\InteractionEngine\System\Workforce\WorkforceIntegrationContract;

$fails = [];
$check = static function (bool $ok, string $message) use (&$fails): void {
    echo ($ok ? 'PASS ' : 'FAIL ').$message."\n";
    if (!$ok) $fails[] = $message;
};

$extension = json_decode((string) file_get_contents($root.'/extension.json'), true, 512, JSON_THROW_ON_ERROR);
$manifest = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true, 512, JSON_THROW_ON_ERROR);
$package = json_decode((string) file_get_contents($root.'/package.json'), true, 512, JSON_THROW_ON_ERROR);
$workforce = WorkforceIntegrationContract::definition();

$version = $extension['version'] ?? null;
$check($version === '10.12.0', 'current Interaction Engine release is 10.12.0');
$check(($manifest['version'] ?? null) === $version, 'extension manifests share one current release version');
$check(($package['version'] ?? null) === $version, 'npm package matches current release version');
$check(($workforce['provider']['version'] ?? null) === $version, 'Workforce provider manifest matches current release version');

$stale = [];
$walk = static function ($value, string $path = '') use (&$walk, &$stale, $version): void {
    if (!is_array($value)) return;
    foreach ($value as $key => $item) {
        $next = $path === '' ? (string)$key : $path.'.'.$key;
        if ($key === 'provider_version' && is_string($item) && $item !== $version) $stale[] = $next.'='.$item;
        $walk($item, $next);
    }
};
$walk($workforce);
$check($stale === [], 'all active Workforce provider pins match current release');

$historical = json_decode((string) file_get_contents($root.'/MERGE_MANIFEST.json'), true, 512, JSON_THROW_ON_ERROR);
$check(($historical['build']['version'] ?? null) === '10.3.2', 'historical MERGE_MANIFEST evidence preserved unchanged');

require_once $root.'/System/Release/CurrentRelease.php';
$release = new App\Extensions\InteractionEngine\System\Release\CurrentRelease();
$check($release->version() === $version, 'runtime CurrentRelease resolves canonical extension version');

foreach ([$root.'/routes/admin.php', $root.'/System/Http/Controllers/AdminSettingsController.php'] as $activeSurface) {
    $activeSource = (string) file_get_contents($activeSurface);
    $check(!str_contains($activeSource, "'10.3.2'"), basename($activeSurface).' does not hard-code historical release version');
}

exit($fails ? 1 : 0);
