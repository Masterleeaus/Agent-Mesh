<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\TitanInterfaceRuntime\\';
    if (! str_starts_with($class, $prefix)) return;
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $path = $root . '/' . $relative . '.php';
    if (is_file($path)) require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadAuthorityRouter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Authority\InMemoryReadCache;
use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\CapabilityReadGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Authority\CapabilityReadAuthorityAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\LegacyRouteReadAuthorityAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Data\DataModeProjector;
use App\Extensions\TitanInterfaceRuntime\System\Data\ArrayLegacyRouteLocator;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryLegacyDataSurfaceRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;

$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) $failures[] = $message;
};

$view = static fn(string $key, bool $customerSafe = true, array $surfaces = ['command','hub'], array $permissions = ['crm.customer.view']): array => [
    'key'=>$key,'label'=>'Customers','kind'=>'table','applies_to'=>['crm.customer'],
    'product_surfaces'=>$surfaces,'customer_safe'=>$customerSafe,'permissions'=>$permissions,
    'data_source'=>['authority'=>'titan-crm','mode'=>'read-model','reference'=>'crm.customers.index'],
    'component_hint'=>'table',
];
$object = static fn(): array => [
    'key'=>'crm.customer','label'=>'Customer','data_authority'=>'titan-crm',
    'scope'=>['type'=>'tenant','tenant_key'=>'company_id'],
    'product_surfaces'=>['command','hub'],'customer_safe'=>true,'permissions'=>['crm.customer.view'],
    'lifecycle_ref'=>null,'facet_refs'=>[],'view_refs'=>['crm.customers.table'],'action_refs'=>[],
    'relationship_refs'=>[],'offline_mode'=>'read-only',
];

$views = new InMemoryViewRegistry();
$snapshot = $views->rebuild([
    'titan-crm' => ['objects'=>[$object()], 'views'=>[$view('crm.customers.table')]],
]);
$check(isset($snapshot->views['crm.customers.table']), 'declared view did not register');

$adapter = new class implements ReadAuthorityAdapterContract {
    public int $calls = 0;
    public function supports(string $authority, string $mode): bool { return $authority === 'titan-crm' && $mode === 'read-model'; }
    public function read(InterfaceContext $context, string $authority, string $reference, array $criteria = []): AuthorityReadResult {
        $this->calls++;
        return new AuthorityReadResult($authority, $reference, [['id'=>'C1','company_id'=>$context->companyId]], [
            'source'=>'read-model','adapter'=>'test','company_id'=>$context->companyId,
            'user_id'=>$context->userId,'trace_id'=>$context->traceId,'correlation_id'=>$context->correlationId,
            'retrieved_at'=>'2026-08-17T09:00:00Z','criteria_fingerprint'=>hash('sha256', json_encode($criteria)),
        ]);
    }
};
$router = new ReadAuthorityRouter([$adapter], new InMemoryReadCache());
$reader = new AuthorizedViewReader($views, $router);
$context = new InterfaceContext(companyId:7,userId:11,productSurface:'command',domain:'customers',capabilities:['crm.customer.view'],traceId:'trace-pass8',correlationId:'corr-pass8');
$query = new ReadQuery(filters:['status'=>'active'], sort:[['field'=>'name','direction'=>'asc']], page:1, perPage:25);
$first = $reader->read('crm.customers.table', $context, $query);
$second = $reader->read('crm.customers.table', $context, $query);
$check($first->provenance['company_id'] === 7, 'read provenance omitted tenant scope');
$check($first->provenance['trace_id'] === 'trace-pass8', 'read provenance omitted trace identity');
$check(($second->provenance['cache'] ?? null) === 'request-hit', 'request-local read cache did not report hit');
$check($adapter->calls === 1, 'identical authorized read was not memoized request-locally');

$blocked = false;
try {
    $hub = new InterfaceContext(companyId:7,userId:11,productSurface:'hub',domain:'customers',capabilities:[]);
    $reader->read('crm.customers.table', $hub, new ReadQuery());
} catch (Throwable) { $blocked = true; }
$check($blocked, 'missing view permission did not fail closed');

$hubUnsafeViews = new InMemoryViewRegistry();
$hubUnsafeViews->rebuild(['x'=>['views'=>[$view('crm.secret.table', false, ['command','hub'], [])]]]);
$blocked = false;
try {
    (new AuthorizedViewReader($hubUnsafeViews, $router))->read('crm.secret.table', new InterfaceContext(7,11,'hub','customers'), new ReadQuery());
} catch (Throwable) { $blocked = true; }
$check($blocked, 'Hub rendered customer-unsafe view');

$legacy = new InMemoryLegacyDataSurfaceRegistry();
$legacy->rebuild([
    'titan-crm'=>['objects'=>[$object()], 'legacy_data_surfaces'=>[[
        'key'=>'crm.customers.legacy','route_name'=>'dashboard.user.crm.customers.index',
        'object_refs'=>['crm.customer'],'permissions'=>['crm.customer.view'],
    ]]],
]);
$projector = new DataModeProjector($legacy, new ArrayLegacyRouteLocator([
    'dashboard.user.crm.customers.index'=>'/dashboard/user/crm/customers',
]));
$dataMode = $projector->forObject('crm.customer', $context);
$check(count($dataMode->surfaces) === 1 && $dataMode->surfaces[0]->url === '/dashboard/user/crm/customers', 'legacy Data mode did not preserve existing route');
$check($dataMode->surfaces[0]->embedPolicy === 'deep-link', 'legacy surface was embedded by default instead of safe deep-link');
$hubLegacy = $projector->forObject('crm.customer', new InterfaceContext(7,11,'hub','customers',capabilities:['crm.customer.view']));
$check($hubLegacy->surfaces === [], 'legacy expert/admin Data surface leaked into Hub');

$gateway = new class implements CapabilityReadGatewayContract {
    public function supports(string $authority, string $reference): bool { return $authority === 'titan-crm' && $reference === 'crm.customer.summary'; }
    public function read(InterfaceContext $context, string $authority, string $reference, array $criteria = []): AuthorityReadResult|array { return [['id'=>'C1']]; }
};
$capabilityResult = (new ReadAuthorityRouter([new CapabilityReadAuthorityAdapter($gateway)], new InMemoryReadCache()))
    ->read($context, 'titan-crm', 'capability', 'crm.customer.summary', new ReadQuery());
$check(($capabilityResult->provenance['mode'] ?? null) === 'capability', 'capability read adapter did not preserve read mode provenance');

$legacyRead = (new ReadAuthorityRouter([new LegacyRouteReadAuthorityAdapter(new ArrayLegacyRouteLocator(['dashboard.user.crm.customers.index'=>'/dashboard/user/crm/customers']))], new InMemoryReadCache()))
    ->read($context, 'titan-crm', 'legacy-route', 'dashboard.user.crm.customers.index', new ReadQuery());
$check(($legacyRead->data[0]['embed_policy'] ?? null) === 'deep-link', 'legacy-route read adapter did not fail safe to deep-link metadata');

$tenant8 = new InterfaceContext(companyId:8,userId:11,productSurface:'command',domain:'customers',capabilities:['crm.customer.view'],traceId:'trace-pass8b',correlationId:'corr-pass8b');
$reader->read('crm.customers.table', $tenant8, $query);
$check($adapter->calls === 2, 'request cache crossed tenant boundaries');

$unsafeQuery = false;
try { new ReadQuery(perPage:5000); } catch (Throwable) { $unsafeQuery = true; }
$check($unsafeQuery, 'unbounded read query budget was accepted');

if ($failures !== []) {
    foreach ($failures as $failure) fwrite(STDERR, "FAIL: {$failure}\n");
    exit(1);
}

echo "PASS8_READ_AUTHORITY_LEGACY_DATA_OK\n";
