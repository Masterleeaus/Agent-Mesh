<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$assert = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) $failures[] = $message;
};

$premiumComponents = [
    'mobile-app-shell', 'mobile-app-header', 'mobile-tab-header', 'mobile-bottom-nav',
    'floating-action-button', 'action-sheet', 'mobile-list', 'nested-list', 'sticky-list',
    'story-strip', 'form-wizard', 'mobile-input', 'chip', 'comment-thread', 'network-status',
    'install-prompt', 'upload-preview',
];
foreach ($premiumComponents as $id) {
    $path = $root.'/resources/builder/components/'.$id.'.json';
    $assert(is_file($path), "missing premium component {$id}");
    if (is_file($path)) {
        $json = json_decode((string) file_get_contents($path), true);
        $assert(($json['premium'] ?? false) === true, "{$id} must be premium");
        $assert(($json['source'] ?? null) === 'Mobilekit-v2.9.1-MIT', "{$id} donor provenance missing");
        $assert(($json['authority'] ?? null) === 'presentation-only', "{$id} authority changed");
    }
}

$premiumPages = [
    'mobile-login', 'mobile-register', 'mobile-forgot-password', 'mobile-sms-verification',
    'mobile-lockscreen', 'mobile-profile', 'mobile-chat', 'mobile-product', 'mobile-cart',
    'mobile-invoice', 'mobile-contact', 'mobile-faq', 'mobile-about', 'mobile-blog-post',
    'mobile-fullpage-slider', 'mobile-maintenance', 'mobile-under-construction', 'mobile-blank',
];
foreach ($premiumPages as $id) {
    $path = $root.'/resources/builder/pages/'.$id.'.json';
    $specPath = $root.'/resources/builder/specs/'.$id.'.json';
    $assert(is_file($specPath), "missing renderable premium spec {$id}");
    $assert(is_file($path), "missing premium page preset {$id}");
    if (is_file($path)) {
        $json = json_decode((string) file_get_contents($path), true);
        $assert(($json['premium'] ?? false) === true, "{$id} must be premium");
        $assert(($json['source'] ?? null) === 'Mobilekit-v2.9.1-MIT', "{$id} donor provenance missing");
        $assert(($json['spec'] ?? null) === $id, "{$id} must point to its renderable spec");
    }
}

$assert(is_file($root.'/resources/assets/css/titan-mobilekit-premium.css'), 'premium CSS missing');
$assert(is_file($root.'/resources/assets/js/titan-mobilekit-premium.js'), 'premium runtime missing');
$assert(is_file($root.'/System/Services/Builder/MobilekitPremiumCatalogue.php'), 'safe premium catalogue adapter missing');
$assert(! is_file($root.'/System/Services/Builder/MobilekitComponentAdapter.php'), 'unsafe raw HTML Mobilekit adapter must be removed');

$provider = (string) file_get_contents($root.'/System/TitanBuilderServiceProvider.php');
$assert(str_contains($provider, 'titan-mobilekit-premium.css'), 'premium CSS is not published');
$assert(str_contains($provider, 'titan-mobilekit-premium.js'), 'premium runtime is not published');

$manifest = json_decode((string) file_get_contents($root.'/resources/builder/manifest.json'), true);
$assert(($manifest['premium']['mobilekit']['enabled'] ?? false) === true, 'premium Mobilekit manifest flag missing');
$assert(($manifest['premium']['mobilekit']['component_count'] ?? 0) >= count($premiumComponents), 'premium component count must retain the v0.5 foundation');
$assert(($manifest['premium']['mobilekit']['page_preset_count'] ?? 0) === count($premiumPages), 'premium page preset count mismatch');

if ($failures !== []) {
    fwrite(STDERR, "FAILED\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

echo 'PASS premium_mobilekit_contract ('.count($premiumComponents).' components, '.count($premiumPages)." pages)\n";
