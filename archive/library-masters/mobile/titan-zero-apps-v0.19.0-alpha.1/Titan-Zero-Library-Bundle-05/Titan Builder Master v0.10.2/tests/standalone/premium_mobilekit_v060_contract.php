<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$assert = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) $failures[] = $message;
};

$newComponents = [
    'mobile-checkbox', 'mobile-radio', 'mobile-toggle', 'mobile-stepper', 'mobile-search',
    'form-validation-summary', 'mobile-accordion', 'mobile-dialog', 'mobile-notification',
    'mobile-alert', 'mobile-tooltip', 'mobile-progress', 'mobile-preloader', 'mobile-pagination',
    'go-to-top', 'product-card', 'price-summary', 'media-carousel', 'image-gallery', 'mobile-badge',
];
$forbiddenProps = ['company_id', 'tenant_id', 'user_id', 'html', 'innerHTML', 'script'];

require_once $root.'/System/GenerativeUI/BuilderRegistry.php';
require_once $root.'/System/GenerativeUI/GenerativeUiSpecNormaliser.php';
require_once $root.'/System/GenerativeUI/GenerativeUiSpecValidator.php';

$registry = new App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry($root.'/resources/builder');
$normaliser = new App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecNormaliser($registry);
$validator = new App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator($registry, $normaliser);
foreach ($newComponents as $id) {
    $path = $root.'/resources/builder/components/'.$id.'.json';
    $assert(is_file($path), "missing v0.6 premium component {$id}");
    if (! is_file($path)) continue;

    $json = json_decode((string) file_get_contents($path), true);
    $assert(is_array($json), "{$id} must be valid JSON object");
    $assert(($json['premium'] ?? false) === true, "{$id} must be premium");
    $assert(($json['source'] ?? null) === 'Mobilekit-v2.9.1-MIT', "{$id} donor provenance missing");
    $assert(($json['authority'] ?? null) === 'presentation-only', "{$id} authority changed");
    $props = array_map('strval', (array) ($json['props'] ?? []));
    foreach ($forbiddenProps as $prop) {
        $assert(! in_array($prop, $props, true), "{$id} exposes forbidden prop {$prop}");
    }
    $spec = ['version' => '1.1', 'authority' => 'presentation-only', 'surface' => 'mobile', 'root' => 'root', 'elements' => ['root' => ['type' => $id, 'props' => []]]];
    $result = $validator->validate($spec);
    $assert(($result['valid'] ?? false) === true, "{$id} must be accepted by server Generative UI validator");
}

$manifest = json_decode((string) file_get_contents($root.'/resources/builder/manifest.json'), true);
$assert(version_compare((string) ($manifest['version'] ?? '0.0.0'), '0.6.0', '>='), 'builder manifest must retain v0.6+ premium features');
$assert((int) ($manifest['premium']['mobilekit']['component_count'] ?? 0) >= 37, 'premium total component count must retain at least 37 v0.6 components');
$assert(($manifest['premium']['mobilekit']['page_preset_count'] ?? null) === 18, 'premium page preset count must remain 18');

$theme = json_decode((string) file_get_contents($root.'/resources/builder/themes/mobilekit-premium.json'), true);
$assert(($theme['direction'] ?? null) === 'ltr', 'theme must declare default ltr direction');
$assert(isset($theme['dark_tokens']['surface_muted']), 'theme dark surface_muted token missing');
$assert(isset($theme['dark_tokens']['shadow']), 'theme dark shadow token missing');

$css = (string) file_get_contents($root.'/resources/assets/css/titan-mobilekit-premium.css');
foreach ([
    '.tpm-accordion', '.tpm-dialog', '.tpm-notification', '.tpm-progress', '.tpm-product-card',
    '.tpm-carousel', '.tpm-image-gallery', '[data-tpm-theme="dark"]', '[dir="rtl"]',
] as $needle) {
    $assert(str_contains($css, $needle), "premium CSS missing {$needle}");
}

if ($failures !== []) {
    fwrite(STDERR, "FAILED\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

echo 'PASS premium_mobilekit_v060_contract ('.count($newComponents)." new components)\n";
