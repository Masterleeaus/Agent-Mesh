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
    'System/Registry/FacetDescriptor.php',
    'System/Registry/FacetRegistrySnapshot.php',
    'System/Contracts/Registry/FacetRegistryContract.php',
    'System/Registry/InMemoryFacetRegistry.php',
    'System/Workspace/FacetSlot.php',
    'System/Workspace/ObjectWorkspace.php',
    'System/Workspace/ObjectWorkspaceCompositionException.php',
    'System/Contracts/Workspace/ObjectWorkspaceComposerContract.php',
    'System/Workspace/ObjectWorkspaceComposer.php',
    'System/Discovery/InterfaceContributionValidationResult.php',
    'System/Discovery/InterfaceContributionValidator.php',
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
use App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionValidator;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryFacetRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Workspace\ObjectWorkspaceComposer;

$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) $failures[] = $message;
};

$object = static function (string $key, array $surfaces = ['command', 'hub'], bool $customerSafe = true, array $permissions = []): array {
    return [
        'key' => $key,
        'label' => 'Customer',
        'data_authority' => 'titan-crm',
        'scope' => ['type' => 'tenant', 'tenant_key' => 'company_id'],
        'product_surfaces' => $surfaces,
        'customer_safe' => $customerSafe,
        'permissions' => $permissions,
        'lifecycle_ref' => null,
        'facet_refs' => [],
        'view_refs' => [],
        'action_refs' => [],
        'relationship_refs' => [],
        'offline_mode' => 'read-only',
    ];
};
$facet = static function (string $key, string $kind, string $objectKey, array $surfaces, bool $customerSafe, array $permissions = [], string $container = 'panel'): array {
    return [
        'key' => $key,
        'label' => ucwords(str_replace(['.', '-'], ' ', $key)),
        'kind' => $kind,
        'applies_to' => [$objectKey],
        'container' => $container,
        'product_surfaces' => $surfaces,
        'customer_safe' => $customerSafe,
        'permissions' => $permissions,
        'renderer_hint' => null,
    ];
};

$objects = new InMemoryObjectRegistry();
$objects->rebuild([
    'titan-crm' => ['objects' => [$object('crm.customer')]],
]);

$contributions = [
    'titan-crm' => ['facets' => [
        $facet('crm.customer.summary', 'summary', 'crm.customer', ['command', 'hub'], true, ['crm.customer.view'], 'card'),
        $facet('crm.customer.audit', 'audit', 'crm.customer', ['command'], false, ['crm.audit.view'], 'timeline'),
    ]],
    'titan-connect' => ['facets' => [
        $facet('connect.customer.messages', 'messages', 'crm.customer', ['command', 'hub'], true, ['connect.messages.view'], 'panel'),
    ]],
    'titan-ai' => ['facets' => [
        $facet('ai.customer.recommendations', 'recommendations', 'crm.customer', ['command', 'hub'], true, ['ai.recommendations.view'], 'panel'),
    ]],
];

$facets = new InMemoryFacetRegistry($objects);
$snapshot = $facets->rebuild($contributions);
$check(count($snapshot->facets) === 4, 'valid cross-extension facets were not registered');
$check(($snapshot->byObject['crm.customer'] ?? []) === [
    'crm.customer.summary',
    'connect.customer.messages',
    'crm.customer.audit',
    'ai.customer.recommendations',
], 'facet ordering is not canonical by kind');

$composer = new ObjectWorkspaceComposer($objects, $facets);
$command = new InterfaceContext(
    companyId: 7,
    userId: 11,
    productSurface: 'command',
    domain: 'customers',
    capabilities: ['crm.customer.view', 'connect.messages.view', 'crm.audit.view'],
);
$workspace = $composer->compose(ObjectReference::parse('crm.customer@7:CUST-1'), $command);
$keys = array_map(static fn ($slot): string => $slot->facet->key, $workspace->facets);
$check($keys === ['crm.customer.summary', 'connect.customer.messages', 'crm.customer.audit'], 'unauthorized facet was not omitted or authorized facets missing');
$check(array_reduce($workspace->facets, static fn (bool $carry, $slot): bool => $carry && $slot->loading === 'lazy' && $slot->payload === null, true), 'workspace facet slots are not lazy/deferred');

$hub = new InterfaceContext(
    companyId: 7,
    userId: 11,
    productSurface: 'hub',
    domain: 'customers',
    capabilities: ['crm.customer.view', 'connect.messages.view', 'crm.audit.view', 'ai.recommendations.view'],
);
$hubWorkspace = $composer->compose(ObjectReference::parse('crm.customer@7:CUST-1'), $hub);
$hubKeys = array_map(static fn ($slot): string => $slot->facet->key, $hubWorkspace->facets);
$check($hubKeys === ['crm.customer.summary', 'connect.customer.messages', 'ai.customer.recommendations'], 'Hub workspace leaked customer-unsafe facet or omitted safe facet');

$validator = new InterfaceContributionValidator();
$externalFacetContribution = [
    'schema_version' => '1.0',
    'extension_key' => 'titan-connect',
    'context' => ['required' => ['company_id','user_id','product_surface','domain'], 'optional' => []],
    'domains' => [['key'=>'connect','label'=>'Connect','layer'=>'business','product_surfaces'=>['command'],'intent_surfaces'=>['work'],'object_refs'=>[],'default_view_refs'=>[]]],
    'objects' => [],
    'facets' => [$facet('connect.crm.messages', 'messages', 'crm.customer', ['command'], false)],
    'views' => [], 'actions' => [], 'lifecycles' => [], 'global_work' => [],
    'providers' => ['attention'=>[], 'decisions'=>[], 'insights'=>[]],
    'legacy_data_surfaces' => [],
];
$check($validator->validate($externalFacetContribution, 'titan-connect')->valid(), 'discovery validator rejected a syntactically valid cross-extension facet target');

$badFacets = new InMemoryFacetRegistry($objects);
$bad = $badFacets->rebuild(['broken' => ['facets' => [$facet('broken.ghost', 'notes', 'missing.object', ['command'], false)]]]);
$check(isset($bad->rejected['broken']), 'unknown facet target did not reject contributor');
$check($bad->facets === [], 'facet with unknown object target leaked active registry');

$collisionFacets = new InMemoryFacetRegistry($objects);
$collision = $collisionFacets->rebuild([
    'alpha' => ['facets' => [$facet('shared.summary', 'summary', 'crm.customer', ['command'], false)]],
    'beta' => ['facets' => [$facet('shared.summary', 'summary', 'crm.customer', ['command'], false)]],
]);
$check(isset($collision->collisions['shared.summary']), 'facet collision was not reported');
$check(! isset($collision->facets['shared.summary']), 'collided facet leaked active registry');

if ($failures !== []) {
    foreach ($failures as $failure) fwrite(STDERR, "FAIL: {$failure}\n");
    exit(1);
}

echo "PASS: cross-extension facets enrich one object workspace\n";
echo "PASS: canonical facet kind ordering is deterministic\n";
echo "PASS: permission-aware facet omission is fail closed\n";
echo "PASS: Hub omits customer-unsafe facets\n";
echo "PASS: facet slots are lazy/deferred until a read authority loads them\n";
echo "PASS: cross-extension facet targets are accepted by discovery validation\n";
echo "PASS: unknown object targets and facet collisions fail closed\n";
