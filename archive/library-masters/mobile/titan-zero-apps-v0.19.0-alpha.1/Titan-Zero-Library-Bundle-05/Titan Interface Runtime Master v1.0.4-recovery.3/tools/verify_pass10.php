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

$required = [
    'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\Registry\\GlobalWorkRegistryContract',
    'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\GlobalWork\\GlobalWorkProviderContract',
    'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\GlobalWork\\GlobalWorkProviderGatewayContract',
    'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\GlobalWork\\GlobalWorkTrayAggregatorContract',
    'App\\Extensions\\TitanInterfaceRuntime\\System\\Registry\\InMemoryGlobalWorkRegistry',
    'App\\Extensions\\TitanInterfaceRuntime\\System\\GlobalWork\\GlobalWorkItemReference',
    'App\\Extensions\\TitanInterfaceRuntime\\System\\GlobalWork\\GlobalWorkTrayAggregator',
];

foreach ($required as $class) {
    if (! class_exists($class) && ! interface_exists($class)) {
        fwrite(STDERR, "FAIL: missing {$class}\n");
        exit(1);
    }
}

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkProviderGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkItemReference;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkProviderHealth;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkProviderResult;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkTrayAggregator;
use App\Extensions\TitanInterfaceRuntime\System\Registry\GlobalWorkDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryGlobalWorkRegistry;

$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void { if (! $condition) $failures[] = $message; };

$contributions = [
    'crm-core' => ['global_work' => [
        ['tray'=>'attention','provider_ref'=>'overdue','product_surfaces'=>['command','go']],
        ['tray'=>'approvals','provider_ref'=>'manager-approvals','product_surfaces'=>['command']],
    ]],
    'titan-connect' => ['global_work' => [
        ['tray'=>'inbox','provider_ref'=>'inbox','product_surfaces'=>['command','go','hub']],
    ]],
    'titan-sync' => ['global_work' => [
        ['tray'=>'sync','provider_ref'=>'device-sync','product_surfaces'=>['command','go']],
    ]],
];

$manifest=json_decode((string)file_get_contents($root.'/resources/interface/interface-manifest.json'),true,512,JSON_THROW_ON_ERROR);
$manifest['global_work']=[['tray'=>'unsupported','provider_ref'=>'ok','product_surfaces'=>['command']]];
$validation=(new App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionValidator())->validate($manifest,'titan-interface-runtime');
$check(!$validation->valid() && (bool)array_filter($validation->errors,fn($e)=>str_contains($e,'global_work entry 0 tray is invalid')),'invalid global_work declaration did not fail contribution validation');

$registry = new InMemoryGlobalWorkRegistry();
$snapshot = $registry->rebuild($contributions);
$check(count($snapshot->declarations) === 4, 'registry did not register all global work declarations');
$check(count($registry->forTray('attention','command')) === 1, 'attention tray declaration unavailable on command');
$check(count($registry->forTray('approvals','go')) === 0, 'approvals leaked to go surface');
$check(count($registry->forTray('inbox','hub')) === 1, 'hub inbox declaration was lost');

$gateway = new class implements GlobalWorkProviderGatewayContract {
    public function fetch(GlobalWorkDescriptor $descriptor, InterfaceContext $context, int $limit): GlobalWorkProviderResult
    {
        if ($descriptor->providerRef === 'device-sync') throw new RuntimeException('sync backend unavailable');
        $items = match ($descriptor->providerRef) {
            'overdue' => [
                new GlobalWorkItemReference('attention','late-job','crm','job@7:42','Job 42 may be late',90,1700000100,7,'job@7:42',null,null,['jobs.view']),
                new GlobalWorkItemReference('attention','late-job-duplicate','crm','job@7:42','Duplicate projection',20,1700000000,7,'job@7:42'),
                new GlobalWorkItemReference('attention','wrong-tenant','crm','job@8:99','Wrong tenant',100,1700000200,8,'job@8:99'),
                new GlobalWorkItemReference('attention','needs-admin','crm','job@7:77','Admin only',95,1700000300,7,'job@7:77',null,null,['admin.only']),
            ],
            'manager-approvals' => [new GlobalWorkItemReference('approvals','approve-1','risk','approval:abc','Approve refund',80,1700000400,7,null,null,'refund.approve')],
            'inbox' => [],
            default => [],
        };
        return new GlobalWorkProviderResult($items, new GlobalWorkProviderHealth($descriptor->providerKey(),'healthy',null,count($items)));
    }
};

$context = new InterfaceContext(7,11,'command','work',roles:['manager'],capabilities:['jobs.view'],traceId:'trace-p10',correlationId:'corr-p10');
$aggregator = new GlobalWorkTrayAggregator($registry,$gateway,50);
$attention = $aggregator->aggregate($context,'attention');
$check($attention->status === 'ready', 'healthy non-empty tray was not ready');
$check(count($attention->items) === 1, 'tenant/permission/dedup filtering did not reduce attention items correctly');
$check($attention->items[0]->sourceReference === 'job@7:42', 'wrong attention item survived filtering');
$check($attention->deduplicated === 1, 'duplicate source reference was not counted');
$check(($attention->omitted['tenant'] ?? 0) === 1, 'wrong-tenant item was not omitted');
$check(($attention->omitted['permission'] ?? 0) === 1, 'unauthorized item was not omitted');

$empty = $aggregator->aggregate($context,'inbox');
$check($empty->status === 'empty', 'healthy empty tray did not report empty');
$degraded = $aggregator->aggregate($context,'sync');
$check($degraded->status === 'degraded', 'provider failure did not degrade tray');
$check($degraded->items === [], 'degraded source invented tray items');

$limitedGateway = new class implements GlobalWorkProviderGatewayContract {
    public function fetch(GlobalWorkDescriptor $descriptor, InterfaceContext $context, int $limit): GlobalWorkProviderResult
    {
        return new GlobalWorkProviderResult([
            new GlobalWorkItemReference('attention','a','crm','job@7:1','A',10,100,7),
            new GlobalWorkItemReference('attention','b','crm','job@7:2','B',90,50,7),
            new GlobalWorkItemReference('attention','c','crm','job@7:3','C',90,60,7),
        ], new GlobalWorkProviderHealth($descriptor->providerKey(),'healthy',null,3));
    }
};
$limited = (new GlobalWorkTrayAggregator($registry,$limitedGateway,2))->aggregate($context,'attention');
$check(array_map(fn($i)=>$i->itemKey,$limited->items) === ['c','b'], 'priority/recency ordering or limit is incorrect');
$check($limited->truncated === true, 'truncation was not reported');

if ($failures !== []) { foreach ($failures as $failure) fwrite(STDERR,"FAIL: {$failure}\n"); exit(1); }
echo "PASS10_GLOBAL_WORK_TRAYS_OK\n";
