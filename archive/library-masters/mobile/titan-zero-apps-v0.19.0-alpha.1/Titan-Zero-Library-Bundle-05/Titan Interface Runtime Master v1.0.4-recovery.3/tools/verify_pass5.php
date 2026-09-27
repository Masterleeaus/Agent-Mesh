<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$required = [
    'System/Context/ContextResolutionException.php',
    'System/Context/InterfaceContext.php',
    'System/Objects/ObjectReference.php',
    'System/Objects/ObjectReferenceResolutionException.php',
    'System/Objects/ResolvedObjectReference.php',
    'System/Registry/ObjectDescriptor.php',
    'System/Registry/ObjectRelationshipDescriptor.php',
    'System/Registry/ObjectRegistrySnapshot.php',
    'System/Contracts/Registry/ObjectRegistryContract.php',
    'System/Registry/InMemoryObjectRegistry.php',
];
foreach ($required as $file) {
    $path = $root . '/' . $file;
    if (! is_file($path)) {
        fwrite(STDERR, "FAIL: missing {$file}\n");
        exit(1);
    }
    require_once $path;
}

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReferenceResolutionException;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;

$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) $failures[] = $message;
};

$object = static function (string $key, array $surfaces, array $relationships = [], bool $customerSafe = false, string $scope = 'tenant'): array {
    return [
        'key' => $key,
        'label' => ucfirst(str_replace(['.', '-'], ' ', $key)),
        'data_authority' => str_contains($key, '.') ? explode('.', $key, 2)[0] : 'platform',
        'scope' => [
            'type' => $scope,
            'tenant_key' => $scope === 'tenant' ? 'company_id' : null,
        ],
        'product_surfaces' => $surfaces,
        'customer_safe' => $customerSafe,
        'permissions' => [],
        'lifecycle_ref' => null,
        'facet_refs' => [],
        'view_refs' => [],
        'action_refs' => [],
        'relationship_refs' => $relationships,
        'offline_mode' => 'read-only',
    ];
};

$registry = new InMemoryObjectRegistry();
$snapshot = $registry->rebuild([
    'titan-crm' => ['descriptor' => ['objects' => [
        $object('crm.customer', ['command', 'hub'], ['field.job'], true),
    ]]],
    'titan-field' => ['descriptor' => ['objects' => [
        $object('field.job', ['command', 'go'], ['crm.customer']),
    ]]],
]);
$check($snapshot->collisions === [], 'valid cross-extension objects unexpectedly collided');
$check(array_keys($snapshot->objects) === ['crm.customer', 'field.job'], 'object ordering is not deterministic by key');
$check(count($snapshot->relationships) === 2, 'cross-extension relationship edges were not normalized');
$check(($snapshot->relationships['crm.customer->field.job']->targetObjectKey ?? null) === 'field.job', 'customer->job relationship missing');

$commandContext = new InterfaceContext(companyId: 7, userId: 11, productSurface: 'command', domain: 'customers');
$resolved = $registry->resolve(ObjectReference::parse('crm.customer@7:CUST-01'), $commandContext);
$check($resolved->object->key === 'crm.customer', 'valid object reference did not resolve');
$check($resolved->reference->objectId === 'CUST-01', 'object identifier was not preserved');

try {
    $registry->resolve(ObjectReference::parse('crm.customer@8:CUST-01'), $commandContext);
    $failures[] = 'cross-tenant object reference was accepted';
} catch (ObjectReferenceResolutionException $e) {
    $check(str_contains($e->getMessage(), 'tenant'), 'cross-tenant rejection did not identify tenant boundary');
}

$hubContext = new InterfaceContext(companyId: 7, userId: 11, productSurface: 'hub', domain: 'work');
try {
    $registry->resolve(ObjectReference::parse('field.job@7:JOB-1'), $hubContext);
    $failures[] = 'unsupported product surface object reference was accepted';
} catch (ObjectReferenceResolutionException $e) {
    $check(str_contains($e->getMessage(), 'product surface'), 'surface rejection did not identify product surface');
}

$collisionRegistry = new InMemoryObjectRegistry();
$collision = $collisionRegistry->rebuild([
    'alpha' => ['objects' => [$object('shared.object', ['command'])]],
    'beta' => ['objects' => [$object('shared.object', ['command'])]],
]);
$check(isset($collision->collisions['shared.object']), 'cross-extension object collision was not reported');
$check(! isset($collision->objects['shared.object']), 'collided object leaked into active registry');

$unknownRegistry = new InMemoryObjectRegistry();
$unknown = $unknownRegistry->rebuild([
    'bad' => ['objects' => [$object('bad.object', ['command'], ['missing.object'])]],
]);
$check(isset($unknown->rejected['bad']), 'unknown relationship reference did not reject contributor');
$check($unknown->objects === [], 'contributor with unresolved relationship leaked active object');

foreach (['../crm.customer@7:1', 'crm.customer@7:', 'crm.customer@7:../../etc', 'crm.customer@@7:1'] as $unsafe) {
    try {
        ObjectReference::parse($unsafe);
        $failures[] = "unsafe object reference '{$unsafe}' was accepted";
    } catch (ObjectReferenceResolutionException) {
    }
}

$globalRegistry = new InMemoryObjectRegistry();
$globalRegistry->rebuild([
    'platform' => ['objects' => [$object('platform.release', ['command'], [], false, 'global')]],
]);
$global = $globalRegistry->resolve(ObjectReference::parse('platform.release:REL-1'), $commandContext);
$check($global->object->scopeType === 'global', 'global object did not resolve');
try {
    $globalRegistry->resolve(ObjectReference::parse('platform.release@7:REL-1'), $commandContext);
    $failures[] = 'tenant-qualified reference was accepted for global object';
} catch (ObjectReferenceResolutionException) {
}

if ($failures !== []) {
    foreach ($failures as $failure) fwrite(STDERR, "FAIL: {$failure}\n");
    exit(1);
}

echo "PASS: deterministic cross-extension object registry\n";
echo "PASS: relationship references normalize across contributors\n";
echo "PASS: canonical object-reference parsing and resolution\n";
echo "PASS: tenant-scoped object references fail closed across tenants\n";
echo "PASS: product-surface visibility is enforced during resolution\n";
echo "PASS: object collisions and unknown relationships fail closed\n";
echo "PASS: unsafe object reference syntax is rejected\n";
echo "PASS: global object references remain tenant-neutral\n";
