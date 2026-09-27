<?php

declare(strict_types=1);
$root = dirname(__DIR__, 2);
$failures = [];
$assert = static function (bool $condition, string $message) use (&$failures): void { if (! $condition) $failures[] = $message; };
$components = ['auth-panel','profile-hero','profile-stat-grid','chat-thread','chat-message','chat-composer','invoice-header','invoice-party','invoice-line-items','invoice-total','cart-item','product-detail','rating-summary','article-header','article-body','social-links','system-state'];
$blocks = ['premium-auth-flow','premium-profile-overview','premium-messaging-conversation','premium-invoice-document','premium-cart-checkout','premium-product-commerce','premium-article-story','premium-contact-business','premium-system-state'];
$templates = ['premium-customer-app','premium-field-app','premium-commerce-app','premium-booking-app','premium-membership-app','premium-service-app'];
require_once $root.'/System/GenerativeUI/BuilderRegistry.php';
require_once $root.'/System/GenerativeUI/GenerativeUiSpecNormaliser.php';
require_once $root.'/System/GenerativeUI/GenerativeUiSpecValidator.php';
$registry = new App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry($root.'/resources/builder');
$normaliser = new App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecNormaliser($registry);
$validator = new App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator($registry, $normaliser);
foreach ($components as $id) {
    $path = $root.'/resources/builder/components/'.$id.'.json';
    $assert(is_file($path), "missing v0.7 component {$id}");
    if (!is_file($path)) continue;
    $json = json_decode((string) file_get_contents($path), true);
    $assert(($json['premium'] ?? false) === true, "{$id} must be premium");
    $assert(($json['authority'] ?? null) === 'presentation-only', "{$id} authority changed");
    $assert(($json['source'] ?? null) === 'Mobilekit-v2.9.1-MIT', "{$id} donor provenance missing");
    $spec = ['version'=>'1.1','authority'=>'presentation-only','surface'=>'mobile','root'=>'root','elements'=>['root'=>['type'=>$id,'props'=>[]]]];
    $assert(($validator->validate($spec)['valid'] ?? false) === true, "{$id} rejected by server validator");
}
foreach ($blocks as $id) $assert(is_file($root.'/resources/builder/blocks/'.$id.'.json'), "missing v0.7 block {$id}");
foreach ($templates as $id) {
    $path = $root.'/resources/builder/templates/'.$id.'.json';
    $assert(is_file($path), "missing v0.7 template {$id}");
    if (is_file($path)) {
        $json = json_decode((string) file_get_contents($path), true);
        $assert(($json['company_boundary'] ?? null) === 'company_id', "{$id} must declare company_id boundary");
    }
}
$manifest = json_decode((string) file_get_contents($root.'/resources/builder/manifest.json'), true);
$assert(version_compare((string) ($manifest['version'] ?? '0.0.0'), '0.7.0', '>='), 'builder manifest must retain v0.7+ Premium Application Patterns');
$assert(($manifest['premium']['mobilekit']['component_count'] ?? null) === 54, 'premium component count must be 54');
$assert(($manifest['premium']['mobilekit']['block_count'] ?? null) === 9, 'premium block count must be 9');
$assert(($manifest['premium']['mobilekit']['app_template_count'] ?? null) === 6, 'premium app template count must be 6');
$assert(is_file($root.'/resources/builder/specs/premium-application-patterns.json'), 'application-pattern showcase spec missing');
$assert(is_file($root.'/resources/builder/pages/premium-application-patterns.json'), 'application-pattern showcase page missing');
if ($failures !== []) { fwrite(STDERR, "FAILED\n - ".implode("\n - ", $failures)."\n"); exit(1); }
echo 'PASS premium_mobilekit_v070_contract ('.count($components).' components, '.count($blocks).' blocks, '.count($templates)." templates)\n";
