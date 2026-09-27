<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$required = [
    'System/Surfaces/IntentSurfaceCatalog.php',
    'System/Registry/DomainDescriptor.php',
    'System/Registry/DomainRegistrySnapshot.php',
    'System/Contracts/Registry/DomainRegistryContract.php',
    'System/Registry/InMemoryDomainRegistry.php',
    'System/Navigation/NavigationProjection.php',
    'System/Contracts/Navigation/NavigationProjectorContract.php',
    'System/Navigation/RegistryNavigationProjector.php',
];
foreach ($required as $file) {
    $path = $root . '/' . $file;
    if (! is_file($path)) {
        fwrite(STDERR, "FAIL: missing {$file}\n");
        exit(1);
    }
    require_once $path;
}

use App\Extensions\TitanInterfaceRuntime\System\Navigation\RegistryNavigationProjector;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryDomainRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Surfaces\IntentSurfaceCatalog;

$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) $failures[] = $message;
};

$contributions = [
    'titan-crm' => [
        'domains' => [[
            'key' => 'customers',
            'label' => 'Customers',
            'layer' => 'business',
            'product_surfaces' => ['command', 'hub'],
            'intent_surfaces' => ['data', 'home', 'ask', 'work', 'do', 'decide', 'explore', 'insights'],
            'object_refs' => ['crm.customer'],
            'default_view_refs' => ['crm.customer.cards'],
            'priority' => 20,
        ]],
    ],
    'titan-field' => [
        'domains' => [[
            'key' => 'work',
            'label' => 'Work',
            'layer' => 'business',
            'product_surfaces' => ['go', 'command'],
            'intent_surfaces' => ['work', 'home', 'do', 'data'],
            'object_refs' => ['field.job'],
            'default_view_refs' => ['field.jobs.board'],
            'priority' => 10,
        ]],
    ],
    'titan-platform' => [
        'domains' => [[
            'key' => 'platform',
            'label' => 'Platform',
            'layer' => 'platform',
            'product_surfaces' => ['command'],
            'intent_surfaces' => ['home', 'insights', 'data'],
            'object_refs' => [],
            'default_view_refs' => [],
            'priority' => 100,
        ]],
    ],
];

$registry = new InMemoryDomainRegistry();
$snapshot = $registry->rebuild($contributions);
$check($snapshot->collisions === [], 'unexpected collision in valid multi-extension registry');
$check(array_keys($snapshot->domains) === ['work', 'customers', 'platform'], 'domain priority/order is not deterministic');
$check($snapshot->domains['customers']->intentSurfaces === IntentSurfaceCatalog::keys(), 'intent surfaces were not normalized to canonical order');
$check(array_keys($registry->visibleFor('hub')) === ['customers'], 'hub visibility leaked non-hub domain');
$check(array_keys($registry->visibleFor('go')) === ['work'], 'go visibility leaked non-go domain');
$check(array_keys($registry->visibleFor('command')) === ['work', 'customers', 'platform'], 'command ordering/visibility mismatch');

$projector = new RegistryNavigationProjector($registry);
$hub = $projector->project('hub', 'customers', 'work');
$check(count($hub->items) === 1, 'hub navigation should include exactly one visible domain');
$check(($hub->items[0]['key'] ?? null) === 'customers', 'hub navigation did not contain customers domain');
$check(($hub->items[0]['active'] ?? null) === true, 'active domain flag missing');
$check(($hub->items[0]['intent_surfaces'][2]['key'] ?? null) === 'work', 'canonical intent order not preserved in navigation projection');
$check(($hub->items[0]['intent_surfaces'][2]['active'] ?? null) === true, 'active intent surface flag missing');

$collisionRegistry = new InMemoryDomainRegistry();
$collision = $collisionRegistry->rebuild([
    'alpha' => ['domains' => [[
        'key' => 'customers', 'label' => 'Customers A', 'layer' => 'business',
        'product_surfaces' => ['command'], 'intent_surfaces' => ['home'],
        'object_refs' => [], 'default_view_refs' => [], 'priority' => 10,
    ]]],
    'beta' => ['domains' => [[
        'key' => 'customers', 'label' => 'Customers B', 'layer' => 'business',
        'product_surfaces' => ['command'], 'intent_surfaces' => ['home'],
        'object_refs' => [], 'default_view_refs' => [], 'priority' => 1,
    ]]],
]);
$check(isset($collision->collisions['customers']), 'duplicate domain key was not reported as collision');
$check(! isset($collision->domains['customers']), 'collided domain must fail closed rather than pick a winner');
$check($collisionRegistry->visibleFor('command') === [], 'collided domain leaked into navigation-visible registry');

$invalidRegistry = new InMemoryDomainRegistry();
$invalid = $invalidRegistry->rebuild([
    'bad-extension' => ['domains' => [[
        'key' => 'bad', 'label' => 'Bad', 'layer' => 'business',
        'product_surfaces' => ['command'], 'intent_surfaces' => ['home', 'unknown'],
        'object_refs' => [], 'default_view_refs' => [], 'priority' => 10,
    ]]],
]);
$check(isset($invalid->rejected['bad-extension']), 'unknown intent surface was not rejected');
$check($invalid->domains === [], 'invalid contributor domain leaked into active registry');

if ($failures !== []) {
    foreach ($failures as $failure) fwrite(STDERR, "FAIL: {$failure}\n");
    exit(1);
}

echo "PASS: canonical intent surface catalog\n";
echo "PASS: multi-extension domain ordering\n";
echo "PASS: product-surface visibility filtering\n";
echo "PASS: navigation projection is registry-derived\n";
echo "PASS: duplicate domain collisions fail closed\n";
echo "PASS: unknown intent surfaces are rejected\n";
