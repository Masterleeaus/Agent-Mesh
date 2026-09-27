<?php

declare(strict_types=1);
$root = dirname(__DIR__, 2);
$read = static fn(string $path): array => json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

$products = ['customer'=>'Titan Hub','field'=>'Titan Go','owner'=>'Titan Command','onboarding'=>'Titan Onboarding'];
foreach ($products as $surface => $product) {
    $template = $read($root.'/resources/builder/templates/'.$surface.'.json');
    if (($template['identity']['product'] ?? null) !== $product) { throw new RuntimeException("{$surface} product mismatch"); }
    if (! isset($template['default_page']['spec'])) { throw new RuntimeException("{$surface} has no default provisioned page"); }
    if (! is_file($root.'/resources/builder/specs/'.$template['default_page']['spec'].'.json')) { throw new RuntimeException("{$surface} default spec missing"); }
}

$plumbing = $read($root.'/resources/builder/verticals/plumbing.json');
if (($plumbing['id'] ?? null) !== 'plumbing' || ($plumbing['business_configuration_authority'] ?? null) !== 'CRM') {
    throw new RuntimeException('Apex Plumbing representative vertical is not CRM-authoritative.');
}
$encoded = json_encode($plumbing, JSON_THROW_ON_ERROR);
if (stripos($encoded, 'workcore') !== false) { throw new RuntimeException('Plumbing pack still contains active legacy architecture.'); }
foreach ((array) ($plumbing['action_intents'] ?? []) as $intent) {
    if (! str_starts_with((string) $intent, 'crm.')) { throw new RuntimeException('Plumbing action intent is not CRM-governed.'); }
}

$onboarding = $read($root.'/resources/builder/templates/onboarding.json');
foreach (['titan-ai.runtime','interaction-engine.runtime','crm.business.configuration','mobile.onboarding'] as $capability) {
    if (! in_array($capability, (array) ($onboarding['capabilities']['required'] ?? []), true)) {
        throw new RuntimeException('Onboarding missing capability '.$capability);
    }
}
foreach (['builder.brand.update','builder.vertical.apply','builder.preview','builder.readiness','builder.publish'] as $intent) {
    if (! in_array($intent, (array) ($onboarding['actions']['intents'] ?? []), true)) {
        throw new RuntimeException('Onboarding missing governed Builder intent '.$intent);
    }
}

echo "Representative Apex Plumbing onboarding resources PASS\n";
