<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\InteractionEngine\\System\\';
    if (!str_starts_with($class, $prefix)) return;
    $file = $root . '/System/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) require_once $file;
});

use App\Extensions\InteractionEngine\System\Settings\SettingsPolicy;

$failed = 0; $count = 0;
$check = static function (bool $condition, string $message) use (&$failed, &$count): void {
    $count++;
    echo ($condition ? 'PASS ' : 'FAIL ') . $message . "\n";
    if (!$condition) $failed++;
};

$policy = new SettingsPolicy();
$platform = $policy->sanitizePlatform([
    'enabled' => '0',
    'default_renderer' => 'hybrid',
    'local_intelligence_enabled' => '1',
    'local_minimum_confidence' => '0.72',
    'offline_enabled' => '1',
    'cache_ttl' => '1800',
    'fresh_authentication_seconds' => '600',
    'approval_secret' => 'must-never-be-stored-here',
]);
$check($platform['enabled'] === false, 'platform enabled setting is normalized to boolean');
$check($platform['local_minimum_confidence'] === 0.72, 'platform confidence setting is normalized to bounded float');
$check(!array_key_exists('approval_secret', $platform), 'platform settings reject secret values');

$company = $policy->sanitizeCompany([
    'default_renderer' => 'conversational',
    'local_intelligence_enabled' => true,
    'offline_enabled' => false,
    'interaction_style' => 'conversational',
    'offline_behavior' => 'online_first',
    'authority_level' => 'delegated_autonomous',
]);
$check($company['interaction_style'] === 'conversational', 'company interaction style is accepted');
$check(!array_key_exists('authority_level', $company), 'company settings cannot bypass capability authority policy');

$user = $policy->sanitizeUser([
    'interaction_style' => 'structured',
    'guidance_detail' => 'concise',
    'local_guidance_enabled' => '0',
    'offline_preference' => 'offline_first',
    'company_id' => 'evil-company',
]);
$check($user['local_guidance_enabled'] === false, 'personal local guidance preference is normalized');
$check(!array_key_exists('company_id', $user), 'personal settings cannot override company_id');

$adminRoutes = (string) file_get_contents($root . '/routes/admin.php');
$userRoutes = (string) file_get_contents($root . '/routes/user.php');
$check(str_contains($adminRoutes, "'/settings'") && str_contains($adminRoutes, 'AdminSettingsController'), 'super admin settings routes are registered');
$check(str_contains($userRoutes, "'/settings'") && str_contains($userRoutes, 'CompanySettingsController'), 'company/user settings routes are registered');
$check(str_contains($userRoutes, "'/settings/company'") && str_contains($userRoutes, "'/settings/preferences'"), 'company and personal updates use separate routes');

foreach ([
    'System/Http/Controllers/AdminSettingsController.php',
    'System/Http/Controllers/CompanySettingsController.php',
    'System/Settings/SettingsRepository.php',
    'System/Settings/SettingsResolver.php',
    'resources/views/settings/admin.blade.php',
    'resources/views/settings/user.blade.php',
    'database/migrations/2026_08_09_010000_create_interaction_settings_tables.php',
] as $path) {
    $check(is_file($root . '/' . $path), $path . ' exists');
}

if (is_file($root . '/System/Http/Controllers/CompanySettingsController.php')) {
    $source = (string) file_get_contents($root . '/System/Http/Controllers/CompanySettingsController.php');
    $check(str_contains($source, "['owner','admin']") || str_contains($source, "['owner', 'admin']"), 'company settings writes are owner/admin restricted');
}

if (is_file($root . '/System/Http/Controllers/AdminSettingsController.php')) {
    $source = (string) file_get_contents($root . '/System/Http/Controllers/AdminSettingsController.php');
    $check(str_contains($source, 'secretStatus'), 'super admin screen exposes secret configuration status only');
    $check(!str_contains($source, "config('interaction-engine.authority.approval_secret')"), 'super admin controller does not return approval secret value');
}


$apiRoutes = (string) file_get_contents($root . '/routes/api.php');
$check(str_contains($apiRoutes, "'/settings'") && str_contains($apiRoutes, 'SettingsApiController'), 'PWA/API settings discovery route is registered');
$check(str_contains($apiRoutes, "'/settings/preferences'") && str_contains($apiRoutes, "'/settings/company'"), 'PWA/API settings updates separate personal and company scopes');
$check(is_file($root . '/System/Http/Controllers/SettingsApiController.php'), 'SettingsApiController exists');
$repositorySource = (string) file_get_contents($root . '/System/Settings/SettingsRepository.php');
$check(str_contains($repositorySource, 'tableAvailable') && str_contains($repositorySource, 'catch (\\Throwable)'), 'settings reads fail safely before database/tables are available');
$resolverSource = (string) file_get_contents($root . '/System/Settings/SettingsResolver.php');
$check(str_contains($resolverSource, 'presentationSnapshot'), 'settings resolver exposes effective PWA presentation preferences');
$check(str_contains($resolverSource, "array_key_exists('show_progress', \$stored)"), 'effective progress preference inherits company default when user has no override');
$wizardControllerSource = (string) file_get_contents($root . '/System/Http/Controllers/WizardController.php');
$check(str_contains($wizardControllerSource, 'presentationSnapshot'), 'wizard API returns effective presentation preferences');

$extension = json_decode((string) file_get_contents($root . '/extension.json'), true, flags: JSON_THROW_ON_ERROR);
$manifest = json_decode((string) file_get_contents($root . '/extension.manifest.json'), true, flags: JSON_THROW_ON_ERROR);
$check(($extension['version'] ?? null) === '10.12.0', 'installer manifest version is 10.12.0');
$check(($manifest['version'] ?? null) === '10.12.0', 'hardened manifest version is 10.12.0');
$check(in_array('interaction.settings.admin', $extension['capabilities'] ?? [], true), 'installer manifest advertises admin settings capability');
$check(in_array('interaction.settings.company', $extension['capabilities'] ?? [], true), 'installer manifest advertises company settings capability');

$stateSource = (string) file_get_contents($root . '/System/Lifecycle/ExtensionState.php');
$check(str_contains($stateSource, 'SettingsResolver'), 'extension enabled state reads persisted platform settings');

$healthSource = (string) file_get_contents($root . '/System/Monitoring/HealthCheck.php');
$check(str_contains($healthSource, 'interaction_platform_settings') && str_contains($healthSource, 'interaction_company_settings'), 'health verifies settings persistence tables');

echo "\n" . ($count - $failed) . "/{$count} Phase 6.1 settings checks passed\n";
exit($failed ? 1 : 0);
