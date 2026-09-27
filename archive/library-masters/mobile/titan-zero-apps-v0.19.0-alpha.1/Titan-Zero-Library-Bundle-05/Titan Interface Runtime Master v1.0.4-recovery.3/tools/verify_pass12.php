<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\TitanInterfaceRuntime\\';
    if (! str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $path = $root . '/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\InMemoryReadCache;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadAuthorityRouter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Collection\CollectionViewSwitcher;
use App\Extensions\TitanInterfaceRuntime\System\Collection\InMemoryCollectionViewPreferenceStore;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;

function expect12(bool $condition, string $message): void { if (! $condition) throw new RuntimeException($message); }

$views = new InMemoryViewRegistry();
$base = [
    'applies_to'=>['crm.customer'],'product_surfaces'=>['command','hub'],'customer_safe'=>true,
    'permissions'=>['crm.customer.view'],'data_source'=>['authority'=>'titan-crm','mode'=>'read-model','reference'=>'crm.customers.collection'],
];
$declared=[];
foreach ([
    ['crm.customers.cards','Customer cards','cards','entity-card'],
    ['crm.customers.table','Customer table','table','table'],
    ['crm.customers.board','Customer board','board','kanban-board'],
    ['crm.customers.calendar','Customer calendar','calendar','data-list'],
    ['crm.customers.timeline','Customer timeline','timeline','timeline'],
    ['crm.customers.feed','Customer feed','feed','data-list'],
] as [$key,$label,$kind,$hint]) $declared[] = array_merge($base,['key'=>$key,'label'=>$label,'kind'=>$kind,'component_hint'=>$hint]);
// This map view intentionally shares authority but belongs to Pass 13 and must not be exposed yet.
$declared[] = array_merge($base,['key'=>'crm.customers.map','label'=>'Customer map','kind'=>'map','component_hint'=>'stack']);
// Different authority/source: valid view, but must not join this switch set.
$declared[] = array_merge($base,['key'=>'crm.customers.analytics','label'=>'Customer analytics','kind'=>'table','data_source'=>['authority'=>'titan-analytics','mode'=>'read-model','reference'=>'analytics.customers']]);
$views->rebuild(['crm'=>['views'=>$declared]]);

$adapter = new class implements ReadAuthorityAdapterContract {
    public int $calls=0;
    public function supports(string $authority,string $mode):bool{return $mode==='read-model';}
    public function read(InterfaceContext $context,string $authority,string $reference,array $criteria=[]):AuthorityReadResult{
        $this->calls++;
        return new AuthorityReadResult($authority,$reference,[
            'items'=>[['id'=>'C1','name'=>'Sarah'],['id'=>'C2','name'=>'Alex']],
            'page'=>$criteria['page'] ?? 1,'per_page'=>$criteria['per_page'] ?? 50,'total'=>2,
        ],['source'=>'pass12-test']);
    }
};
$reader = new AuthorizedViewReader($views,new ReadAuthorityRouter([$adapter],new InMemoryReadCache()));
$vocab = new ArrayComponentVocabulary([
    'entity-card'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'table'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'kanban-board'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'data-list'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'timeline'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'stack'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
]);
$presentation = new BuilderPresentationAdapter($vocab,new PresentationComponentPolicy());
$prefs = new InMemoryCollectionViewPreferenceStore();
$switcher = new CollectionViewSwitcher($views,$reader,$presentation,$prefs);
$context = new InterfaceContext(7,11,'command','customers',capabilities:['crm.customer.view'],traceId:'trace-12',correlationId:'corr-12');
$query = new ReadQuery(filters:['status'=>'active'],sort:[['field'=>'name','direction'=>'asc']],page:2,perPage:25,search:'sar');

$opened = $switcher->open('crm.customer',$context,$query,'crm.customers.cards');
expect12($adapter->calls===1,'opening a collection must read its authority exactly once');
expect12($opened->selectedViewKey==='crm.customers.cards','requested collection view was not selected');
expect12(array_map(fn($v)=>$v->kind,$opened->views)===['cards','table','board','calendar','timeline','feed'],'canonical switch view ordering mismatch');
expect12(!in_array('crm.customers.map',array_map(fn($v)=>$v->viewKey,$opened->views),true),'map must remain deferred to Pass 13');
expect12(!in_array('crm.customers.analytics',array_map(fn($v)=>$v->viewKey,$opened->views),true),'different-authority view must not join switch set');
expect12($opened->query->fingerprint()===$query->fingerprint(),'collection query fingerprint changed');
expect12($opened->source->provenance['criteria_fingerprint']===$query->fingerprint(),'source provenance must retain the same query fingerprint');
expect12($opened->sourceAuthority==='titan-crm' && $opened->sourceReference==='crm.customers.collection','collection authority identity mismatch');

$switched = $switcher->reproject($opened,'crm.customers.board',$context);
expect12($adapter->calls===1,'switching a projection must not refetch authoritative data');
expect12($switched->source===$opened->source,'switching must reuse the exact authoritative read result');
expect12($switched->query->fingerprint()===$opened->query->fingerprint(),'pagination/filter/query state changed during switch');
expect12($switched->selectedViewKey==='crm.customers.board','board projection was not selected');
expect12($switched->presentation->root->props['view_kind']==='board','board presentation metadata missing');
expect12($prefs->get($context,'crm.customer')==='crm.customers.board','user view preference was not persisted');

$reopened = $switcher->open('crm.customer',$context,$query);
expect12($reopened->selectedViewKey==='crm.customers.board','stored view preference was not restored');
expect12($adapter->calls===1,'same query/request scope should reuse read cache when reopening preferred projection');

$changedQuery = new ReadQuery(filters:['status'=>'inactive'],page:1,perPage:25);
$changed = $switcher->open('crm.customer',$context,$changedQuery);
expect12($adapter->calls===2,'changing query semantics must perform a new authoritative read');
expect12($changed->query->fingerprint()!==$opened->query->fingerprint(),'changed query fingerprint did not change');

$hubContext = new InterfaceContext(7,12,'hub','customers',capabilities:['crm.customer.view']);
$hub = $switcher->open('crm.customer',$hubContext,new ReadQuery(),'crm.customers.table');
expect12($hub->selectedViewKey==='crm.customers.table','Hub-safe collection view unavailable');

try {
    $switcher->reproject($opened,'crm.customers.analytics',$context);
    throw new RuntimeException('different-authority switch should fail');
} catch (Throwable $e) { expect12(str_contains(strtolower($e->getMessage()),'switch')||str_contains(strtolower($e->getMessage()),'view'),'different-authority failure should identify view/switch'); }

$otherTenant = new InterfaceContext(8,11,'command','customers',capabilities:['crm.customer.view']);
try {
    $switcher->reproject($opened,'crm.customers.table',$otherTenant);
    throw new RuntimeException('cross-tenant reprojection should fail');
} catch (Throwable $e) { expect12(str_contains(strtolower($e->getMessage()),'context')||str_contains(strtolower($e->getMessage()),'tenant'),'cross-tenant reprojection should fail closed'); }

echo "PASS 12 VERIFY: collection view switching preserves one authority/read result/query scope across cards-table-board-calendar-timeline-feed projections\n";
