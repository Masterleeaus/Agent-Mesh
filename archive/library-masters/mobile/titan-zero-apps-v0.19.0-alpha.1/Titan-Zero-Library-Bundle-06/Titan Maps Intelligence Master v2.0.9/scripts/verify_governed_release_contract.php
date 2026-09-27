<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];
$installer = json_decode((string) file_get_contents($root.'/extension.json'), true, flags: JSON_THROW_ON_ERROR);
$sidecar = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true, flags: JSON_THROW_ON_ERROR);

if (($installer['schema'] ?? null) !== 'titan-extension-v1') $errors[] = 'root installer schema regressed';
if (! is_string($installer['version'] ?? null) || version_compare((string)$installer['version'], '2.0.0-beta.1.9', '<')) $errors[] = 'root version must be beta.1.9 or later';
if (! is_string($sidecar['version'] ?? null) || ! hash_equals((string)$installer['version'], (string)$sidecar['version'])) $errors[] = 'sidecar version must match root version';

$capabilities = $sidecar['capabilities'] ?? [];
if (count($capabilities) !== 44) $errors[] = 'sidecar must declare exactly 44 capabilities';
foreach (['location.geocode','territory.lookup','territory.validate','route.estimate','route.compare','job.travel_context','service_area.check','nearby.search','maps.quota.status','maps.provider.quota.override','maps.provider.health','maps.dispatch.weights.read','maps.dispatch.weights.update'] as $id) {
    if (! in_array($id, $capabilities, true)) $errors[] = "missing canonical capability {$id}";
}

$permissions = $sidecar['permissions'] ?? [];
foreach (['titan-maps-intelligence.location.geocode','titan-maps-intelligence.job.travel-context.read','titan-maps-intelligence.capabilities.read','titan-maps-intelligence.provider-quota.read','titan-maps-intelligence.provider-quota.override','titan-maps-intelligence.dispatch.weights.read','titan-maps-intelligence.dispatch.weights.update','titan-maps-intelligence.provider-health.read'] as $permission) {
    if (! in_array($permission, $permissions, true)) $errors[] = "missing permission {$permission}";
}

$optional = $sidecar['dependencies']['optional'] ?? [];
$optionalKeys = array_values(array_filter(array_map(static fn ($dep) => is_array($dep) ? ($dep['key'] ?? null) : null, $optional)));
foreach (['titan-ai-core','titan-command-bus','titan-risk','titan-assurance','titan-autonomy','titan-knowledge-authority','titan-rewind','titan-go','titan-vertical-engine'] as $key) {
    if (! in_array($key, $optionalKeys, true)) $errors[] = "missing optional dependency {$key}";
}
$required = array_values(array_filter(array_map(static fn ($dep) => is_array($dep) ? ($dep['key'] ?? null) : null, $sidecar['dependencies']['required'] ?? [])));
if ($required !== ['titan-signal']) $errors[] = 'Blueprint convergence permits only titan-signal as the required platform dependency';

if ($errors !== []) {
    fwrite(STDERR, "Governed release contract FAILED\n - ".implode("\n - ", $errors)."\n");
    exit(1);
}

echo "Governed release contract: PASS\n";
