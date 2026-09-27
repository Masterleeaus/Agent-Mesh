<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\InteractionEngine\\System\\';
    if (!str_starts_with($class, $prefix)) return;
    $file = $root . '/System/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) require_once $file;
});

use App\Extensions\InteractionEngine\System\Authority\ApprovalSigner;
use App\Extensions\InteractionEngine\System\Wizard\Offline\LocalCommandOutbox;

$failed = 0; $count = 0;
$check = static function (bool $condition, string $message) use (&$failed, &$count): void {
    $count++;
    echo ($condition ? 'PASS ' : 'FAIL ') . $message . "\n";
    if (!$condition) $failed++;
};

// Install-time boot must not fail just because the administrator has not configured
// the approval secret yet. Approval execution must remain fail-closed until configured.
$constructed = false;
try {
    $signer = new ApprovalSigner('');
    $constructed = true;
} catch (Throwable $e) {
    $signer = null;
}
$check($constructed, 'ApprovalSigner can be constructed before approval secret configuration');
if ($signer instanceof ApprovalSigner) {
    $check(method_exists($signer, 'isConfigured') && $signer->isConfigured() === false, 'unconfigured signer reports not configured');
    $check($signer->verify(['signature' => 'forged']) === false, 'unconfigured signer fails closed when verifying approvals');
    $issued = false;
    try {
        $signer->issue('crm.quote.create', '1', '1', ['owner']);
        $issued = true;
    } catch (Throwable) {}
    $check($issued === false, 'unconfigured signer cannot issue approval grants');
}

// The encrypted offline queue follows the same clean-boot rule, but preserves
// compatibility with already-configured non-empty secrets from 10.3.1.
$outboxConstructed = false;
try {
    $outbox = new LocalCommandOutbox('');
    $outboxConstructed = true;
} catch (Throwable) {
    $outbox = null;
}
$check($outboxConstructed, 'LocalCommandOutbox can be constructed before outbox secret configuration');
if ($outbox instanceof LocalCommandOutbox) {
    $check($outbox->isConfigured() === false, 'unconfigured outbox reports not configured');
    $queued = false;
    try {
        $outbox->enqueue(['id' => 'blocked']);
        $queued = true;
    } catch (Throwable) {}
    $check($queued === false, 'unconfigured outbox cannot enqueue encrypted commands');
}
$legacyOutbox = new LocalCommandOutbox('test-secret');
$check($legacyOutbox->isConfigured() === true, 'existing non-empty outbox secrets remain compatible');

$provider = (string) file_get_contents($root . '/System/InteractionEngineServiceProvider.php');
$check(str_contains($provider, 'registerAdminNavigation'), 'provider registers Super Admin navigation');
$check(str_contains($provider, 'navigation.admin'), 'Super Admin navigation uses navigation.admin contribution channel');
$check(str_contains($provider, 'ContributionRegistry'), 'provider supports Titan ContributionRegistry menu integration');
$check(str_contains($provider, 'syncAdminMenuFallback'), 'provider includes idempotent MagicAI menus-table fallback');
$check(str_contains($provider, "'custom_menu' => 0") && str_contains($provider, "'bolt_menu' => 0"), 'MagicAI menu fallback supplies live-host compatibility columns when present');
$check(str_contains($provider, 'MenuService') && str_contains($provider, 'regenerate'), 'provider invalidates MagicAI menu cache when supported');

$adminRoutes = (string) file_get_contents($root . '/routes/admin.php');
$check(str_contains($adminRoutes, "Route::get('/',") && str_contains($adminRoutes, "->name('index')"), 'Super Admin overview route exists');
$check(str_contains($adminRoutes, "'/settings'") && str_contains($adminRoutes, "->name('settings')"), 'Super Admin settings route exists');
$check(is_file($root . '/resources/views/settings/admin-overview.blade.php'), 'Super Admin overview view exists');
$check(is_file($root . '/resources/views/settings/admin.blade.php'), 'Super Admin settings view exists');

$view = (string) file_get_contents($root . '/resources/views/settings/admin.blade.php');
$check(str_contains($view, 'INTERACTION_APPROVAL_SECRET'), 'settings screen explains how to configure approval signing secret');
$check(str_contains($view, 'Approval-required actions are disabled'), 'settings screen clearly reports fail-closed behavior while secret is missing');

$manifest = json_decode((string) file_get_contents($root . '/extension.manifest.json'), true, flags: JSON_THROW_ON_ERROR);
$contributions = (array) ($manifest['contributions'] ?? []);
$adminContribution = array_values(array_filter($contributions, static fn (array $item): bool => ($item['registry'] ?? null) === 'navigation.admin'));
$check(count($adminContribution) >= 1, 'hardened manifest declares Super Admin navigation contribution');

$extension = json_decode((string) file_get_contents($root . '/extension.json'), true, flags: JSON_THROW_ON_ERROR);
$check(($extension['version'] ?? null) === '10.12.0', 'installer manifest version is 10.12.0');
$check(($manifest['version'] ?? null) === '10.12.0', 'hardened manifest version is 10.12.0');

printf("\n%d/%d Phase 6.2 installer/admin-menu checks passed\n", $count - $failed, $count);
exit($failed ? 1 : 0);
