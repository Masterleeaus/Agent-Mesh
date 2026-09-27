<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$check = static function (bool $ok, string $message) use (&$failures): void {
    if (! $ok) { $failures[] = $message; }
};
$readJson = static function (string $path): array {
    $raw = file_get_contents($path);
    if ($raw === false) { throw new RuntimeException("Cannot read {$path}"); }
    $decoded = json_decode($raw, true);
    if (! is_array($decoded)) { throw new RuntimeException("Invalid JSON {$path}"); }
    return $decoded;
};

$manifest = $readJson($root.'/resources/builder/manifest.json');
$check(version_compare((string)($manifest['version'] ?? '0.0.0'), '0.8.0', '>='), 'builder manifest must preserve v0.8+ contract');
$check(version_compare((string)($readJson($root.'/extension.manifest.json')['version'] ?? '0.0.0'), '0.8.0', '>='), 'extension manifest must preserve v0.8+ contract');

foreach ([
    'System/Contracts/ApplicationProvisioningGateway.php',
    'System/Contracts/CapabilityDiscovery.php',
    'System/Contracts/MobileApplicationDefinitionPublisher.php',
    'System/Data/CrmBuilderDataSourceProvider.php',
    'System/AI/TitanAIAiUiGenerator.php',
    'System/Provisioning/EloquentApplicationProvisioningGateway.php',
    'System/Provisioning/ApplicationReadinessService.php',
    'System/Mobile/JsonMobileApplicationDefinitionPublisher.php',
    'System/Migration/LegacyBusinessSpecMigrator.php',
    'System/Http/Controllers/ApplicationProvisioningController.php',
] as $relative) {
    $check(is_file($root.'/'.$relative), "missing v0.8 implementation: {$relative}");
}

$surfaces = [];
foreach (glob($root.'/resources/builder/surfaces/*.json') ?: [] as $path) {
    $item = $readJson($path); $surfaces[$item['id'] ?? basename($path, '.json')] = $item;
}
foreach (['customer' => 'Titan Hub', 'field' => 'Titan Go', 'owner' => 'Titan Command', 'onboarding' => 'Titan Onboarding'] as $id => $product) {
    $check(isset($surfaces[$id]), "missing surface {$id}");
    if (isset($surfaces[$id])) { $check(($surfaces[$id]['product'] ?? $surfaces[$id]['name'] ?? null) === $product, "surface {$id} product must be {$product}"); }
}

$templates = [];
foreach (glob($root.'/resources/builder/templates/*.json') ?: [] as $path) {
    $item = $readJson($path); $templates[$item['id'] ?? basename($path, '.json')] = $item;
}
foreach (['customer','field','owner','onboarding'] as $id) { $check(isset($templates[$id]), "missing template {$id}"); }

$crmSources = [];
foreach (glob($root.'/resources/builder/data-sources/*.json') ?: [] as $path) {
    $item = $readJson($path); $crmSources[$item['id'] ?? ''] = $item;
    $check(($item['provider'] ?? null) === 'crm', basename($path).' provider must be crm');
    $check(($item['read_only'] ?? null) === true, basename($path).' must be read-only');
    $check(is_string($item['contract'] ?? null) && str_starts_with($item['contract'], 'crm.'), basename($path).' must use crm.* contract');
    $check(is_string($item['required_capability'] ?? null) && str_starts_with($item['required_capability'], 'crm.'), basename($path).' must declare required CRM capability');
    $check(isset($item['surface_compatibility']) && is_array($item['surface_compatibility']), basename($path).' must declare surface compatibility');
}
foreach (['crm-customer-work-orders','crm-field-assigned-work','crm-owner-operations-summary','crm-business-services','crm-business-hours','crm-business-locations'] as $id) {
    $check(isset($crmSources[$id]), "missing CRM data source {$id}");
}

$allowedActions = array_values(array_filter($manifest['allowed_actions'] ?? [], 'is_string'));
foreach ($allowedActions as $action) { $check(! str_starts_with(strtolower($action), 'workcore.'), "active action still WorkCore: {$action}"); }
foreach (['crm.customer.create','crm.work_order.create','crm.work_order.assign','crm.work_order.task.complete','builder.preview','builder.publish','builder.rollback','builder.theme.update'] as $action) {
    $check(in_array($action, $allowedActions, true), "missing allowed action {$action}");
}

$activeRoots = ['System','config','routes','resources/builder','resources/assets/js','resources/js','README.md','AGENT_DEVELOPMENT_PROMPT.md'];
foreach ($activeRoots as $relative) {
    $path = $root.'/'.$relative;
    $files = is_file($path) ? [$path] : iterator_to_array(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS)));
    foreach ($files as $file) {
        $filePath = $file instanceof SplFileInfo ? $file->getPathname() : $file;
        if (! is_file($filePath)) { continue; }
        if (str_ends_with($filePath, '/System/Migration/LegacyBusinessSpecMigrator.php')) { continue; }
        $content = file_get_contents($filePath) ?: '';
        $check(! preg_match('/WorkCore|workcore|WORKCORE/', $content), 'active WorkCore reference: '.substr($filePath, strlen($root)+1));
    }
}

$verticals = glob($root.'/resources/builder/verticals/*.json') ?: [];
$check(count($verticals) === 10, 'must preserve exactly ten canonical vertical packs');
foreach ($verticals as $path) {
    $v = $readJson($path);
    $check(isset($v['crm_capabilities']) && is_array($v['crm_capabilities']), basename($path).' missing crm_capabilities');
    $check(isset($v['read_models']) && is_array($v['read_models']), basename($path).' missing read_models');
    $check(isset($v['action_intents']) && is_array($v['action_intents']), basename($path).' missing action_intents');
    $check(! array_key_exists('workcore_domains', $v), basename($path).' still has workcore_domains');
}

$config = file_get_contents($root.'/config/titan-builder.php') ?: '';
$check(str_contains($config, "'onboarding'"), 'config must expose onboarding preview surface');
foreach (['syncing','conflict','empty','populated','loading','error','permission-denied'] as $state) {
    $check(str_contains($config, "'{$state}'"), "config missing preview state {$state}");
}

$routes = file_get_contents($root.'/routes/api.php') ?: '';
$check(str_contains($routes, '/applications'), 'provisioning API routes missing');
$check(str_contains($routes, 'ApplicationProvisioningController'), 'provisioning controller route missing');

$provider = file_get_contents($root.'/System/TitanBuilderServiceProvider.php') ?: '';
foreach (['TitanAIAiUiGenerator','ApplicationProvisioningGateway','ApplicationReadinessService','MobileApplicationDefinitionPublisher','CapabilityDiscovery'] as $needle) {
    $check(str_contains($provider, $needle), "service provider missing {$needle} integration");
}
$check(str_contains($provider, 'UnavailableAiUiGenerator'), 'AI fallback must remain');

foreach (['ARCHITECTURE.md','CRM-INTEGRATION.md','TITANAI-INTEGRATION.md','TITAN-ONBOARDING-INTEGRATION.md','APPLICATION-PROVISIONING.md','TITAN-MOBILE-CONTRACT.md','FOUR-PWA-SURFACES.md','GENERATIVE-UI-GOVERNANCE.md','FIELD-HOME-SERVICES-VERTICALS.md','WORKCORE-REMOVAL.md','UPGRADE-0.7-TO-0.8.md','KNOWN-LIMITATIONS.md'] as $doc) {
    $check(is_file($root.'/docs/'.$doc), "missing required doc {$doc}");
}

if ($failures !== []) {
    fwrite(STDERR, "Titan Builder v0.8 CRM cutover contract FAILED (".count($failures)."):\n - ".implode("\n - ", $failures)."\n");
    exit(1);
}

echo "Titan Builder v0.8 CRM cutover contract PASS\n";
