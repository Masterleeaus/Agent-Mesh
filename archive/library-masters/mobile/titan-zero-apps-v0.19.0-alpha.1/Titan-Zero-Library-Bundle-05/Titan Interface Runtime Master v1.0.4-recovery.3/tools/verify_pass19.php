<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix='App\\Extensions\\TitanInterfaceRuntime\\';
    if (! str_starts_with($class,$prefix)) return;
    $path=$root.'/'.str_replace('\\','/',substr($class,strlen($prefix))).'.php';
    if (is_file($path)) require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkTrayAggregatorContract;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkItemReference;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkTraySnapshot;
use App\Extensions\TitanInterfaceRuntime\System\Offline\OfflineSyncWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\AccessibilityAuditor;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Performance\PresentationPerformanceGuard;
use App\Extensions\TitanInterfaceRuntime\System\Performance\PresentationCache;

function p19(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}

$context = new InterfaceContext(7, 11, 'go', 'work', deviceId:'device-1', capabilities:['jobs.work.execute']);
$item = new GlobalWorkItemReference(
    tray:'sync', itemKey:'job-42-sync', sourceAuthority:'interaction-engine', sourceReference:'outbox:42',
    label:'Job 42 pending sync', priority:500, occurredAt:1720000000, companyId:7,
    objectRef:'jobs.work-order@7:42', actionRef:'field.resolve-conflict', requiredCapabilities:['jobs.work.execute'],
    metadata:[
        'state'=>'conflict','network_state'=>'offline','queued_count'=>1,'attempts'=>2,
        'last_sync_at'=>'2026-08-18T11:00:00Z',
        'conflict'=>['kind'=>'version-mismatch','summary'=>'Server and device changed the same job.','resolution_action_refs'=>['field.resolve-conflict']],
    ],
);
$agg = new class($item) implements GlobalWorkTrayAggregatorContract {
    public function __construct(private GlobalWorkItemReference $item){}
    public function aggregate(InterfaceContext $context,string $tray,?int $limit=null): GlobalWorkTraySnapshot { return new GlobalWorkTraySnapshot('sync','ready',[$this->item],[]); }
    public function all(InterfaceContext $context,?int $limitPerTray=null): array { return ['sync'=>$this->aggregate($context,'sync',$limitPerTray)]; }
};
$workspace=(new OfflineSyncWorkspaceComposer($agg))->compose($context);
p19($workspace->overallState==='conflict','Conflict state must remain source-owned and visible.');
p19(count($workspace->conflicts)===1,'Conflict surface must be rendered from sync metadata.');
p19(($workspace->items[0]->jsonSerialize()['executable']??true)===false,'Sync presentation must never become executable locally.');

$tree = new PresentationTree('go', new PresentationNode('button','resolve',[ 'accessibility'=>['name'=>'Resolve conflict','focus_visible'=>true,'target_size_px'=>44,'keyboard_operable'=>true] ]));
$audit=(new AccessibilityAuditor())->audit($tree);
p19($audit->passesWcag22AaTarget(),'Accessible action should satisfy the WCAG 2.2 AA target checks.');
$badTree = new PresentationTree('go', new PresentationNode('button','bad',[ 'accessibility'=>['focus_visible'=>false,'target_size_px'=>12] ]));
p19(!(new AccessibilityAuditor())->audit($badTree)->passesWcag22AaTarget(),'Missing name/focus/target size must fail accessibility target checks.');

$guard = new PresentationPerformanceGuard(maxPayloadBytes:65536,maxNodes:100,maxDepth:8,p95BudgetMs:50.0);
$report=$guard->inspect($tree,[0.4,0.7,0.9,1.0,1.2,1.5,2.0,2.5,3.0,4.0]);
p19($report->withinBudget(),'Small presentation tree should remain inside payload/node/depth/p95 budgets.');
$cache = new PresentationCache(2);
$cache->put($context,'en-AU','tree-1',$tree);
p19($cache->get($context,'en-AU','tree-1')?->fingerprint()===$tree->fingerprint(),'Presentation cache must return same scoped tree.');
p19($cache->get(new InterfaceContext(8,11,'go','work'),'en-AU','tree-1')===null,'Presentation cache must not cross tenants.');
p19($cache->get($context,'fr-FR','tree-1')===null,'Presentation cache must be locale-isolated.');

$blocked=false;try{new GlobalWorkItemReference('sync','unsafe','interaction-engine','unsafe','Unsafe',1,0,7,metadata:['payload'=>['secret'=>'x']]);}catch(InvalidArgumentException){$blocked=true;}p19($blocked,'Opaque payload/secret metadata must be rejected at the Global Work boundary.');


$manifest=json_decode((string)file_get_contents($root.'/resources/interface/interface-manifest.json'),true,512,JSON_THROW_ON_ERROR);
$knownProviders=[];
foreach(($manifest['providers']??[]) as $group){foreach((array)$group as $provider){if(is_string($provider['key']??null))$knownProviders[$provider['key']]=true;}}
foreach(($manifest['global_work']??[]) as $work){p19(isset($knownProviders[(string)($work['provider_ref']??'')]),'Every global_work provider_ref must resolve to a declared provider key.');}

echo "PASS 19 VERIFY: source-authoritative offline/sync/conflict, WCAG 2.2 AA target checks, p95/payload budgets and tenant/locale-scoped presentation caching are enforced\n";
