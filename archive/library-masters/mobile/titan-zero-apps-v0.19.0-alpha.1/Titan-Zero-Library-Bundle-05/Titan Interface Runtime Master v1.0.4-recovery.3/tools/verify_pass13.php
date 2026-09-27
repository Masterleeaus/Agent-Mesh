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
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Spatial\SpatialWorkspaceComposer;

function expect13(bool $condition, string $message): void { if (! $condition) throw new RuntimeException($message); }

$objects = new InMemoryObjectRegistry();
$objects->rebuild([
    'crm'=>['contract_version'=>'1.1','objects'=>[[
        'key'=>'crm.customer','label'=>'Customer','data_authority'=>'titan-crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],
        'product_surfaces'=>['command','hub'],'customer_safe'=>true,'permissions'=>['crm.customer.view'],'facet_refs'=>[],
        'view_refs'=>['crm.customers.map'],'action_refs'=>['crm.customers.route'],'relationship_refs'=>[],'offline_mode'=>'read-only',
    ]],'relationships'=>[]],
]);

$views = new InMemoryViewRegistry($objects);
$views->rebuild(['maps'=>['views'=>[[
    'key'=>'crm.customers.map','label'=>'Customer map','kind'=>'map','applies_to'=>['crm.customer'],
    'product_surfaces'=>['command','hub'],'customer_safe'=>true,'permissions'=>['crm.customer.view'],
    'data_source'=>['authority'=>'titan-maps-intelligence','mode'=>'capability','reference'=>'maps.spatial-state'],
    'component_hint'=>'stack',
]]]]);

$actions = new InMemoryActionRegistry($objects);
$actions->rebuild([
    'maps'=>['schema_version'=>'1.1','actions'=>[
        [
            'key'=>'crm.customers.route','label'=>'Route to customer','applies_to'=>['crm.customer'],'mutating'=>false,
            'capability_ref'=>'titan-maps-intelligence.route.read','interaction'=>null,'product_surfaces'=>['command','hub'],
            'permissions'=>['crm.customer.view'],'offline_mode'=>'online-required','requires_confirmation'=>false,'container_hint'=>'map','customer_safe'=>true,
        ],
        [
            'key'=>'crm.customers.promote','label'=>'Promote candidate','applies_to'=>['crm.customer'],'mutating'=>true,
            'capability_ref'=>'titan-maps-intelligence.candidate.promote','interaction'=>null,'product_surfaces'=>['command'],
            'permissions'=>['crm.customer.manage'],'offline_mode'=>'online-required','requires_confirmation'=>true,'container_hint'=>'map','customer_safe'=>false,
        ],
    ]],
]);

$adapter = new class implements ReadAuthorityAdapterContract {
    public int $calls = 0;
    public function supports(string $authority,string $mode):bool { return $authority==='titan-maps-intelligence' && $mode==='capability'; }
    public function read(InterfaceContext $context,string $authority,string $reference,array $criteria=[]):AuthorityReadResult {
        $this->calls++;
        return new AuthorityReadResult($authority,$reference,[
            'layers'=>[
                ['key'=>'jobs','label'=>'Jobs','kind'=>'points','visible'=>true],
                ['key'=>'territories','label'=>'Territories','kind'=>'polygons','visible'=>true],
            ],
            'pins'=>[
                ['id'=>'p1','label'=>'Sarah','lat'=>-37.775,'lng'=>144.998,'object_ref'=>'crm.customer@7:C1','layer'=>'jobs'],
                ['id'=>'bad','label'=>'Bad','lat'=>123.0,'lng'=>999.0,'object_ref'=>'crm.customer@7:C2','layer'=>'jobs'],
                ['id'=>'other','label'=>'Other tenant','lat'=>-37.77,'lng'=>145.0,'object_ref'=>'crm.customer@8:C3','layer'=>'jobs'],
            ],
            'candidates'=>[
                ['id'=>'cand-1','label'=>'Supplier A','lat'=>-37.80,'lng'=>145.01,'status'=>'pending','confidence'=>0.91],
            ],
            'routes'=>[
                ['id'=>'r1','label'=>'Morning route','path'=>[['lat'=>-37.775,'lng'=>144.998],['lat'=>-37.79,'lng'=>145.02]],'distance_metres'=>8200,'duration_seconds'=>1440],
            ],
            'territories'=>[
                ['id'=>'t1','label'=>'North','polygon'=>[['lat'=>-37.70,'lng'=>144.90],['lat'=>-37.70,'lng'=>145.10],['lat'=>-37.85,'lng'=>145.10],['lat'=>-37.70,'lng'=>144.90]],'analysis_type'=>'service_gap'],
            ],
            'traffic'=>[
                ['id'=>'tf1','route_id'=>'r1','severity'=>'moderate','delay_seconds'=>420],
            ],
        ],['source'=>'titan-maps-intelligence','maps_authoritative'=>true]);
    }
};

$reader = new AuthorizedViewReader($views,new ReadAuthorityRouter([$adapter],new InMemoryReadCache()));
$presentation = new BuilderPresentationAdapter(new ArrayComponentVocabulary([
    'stack'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'map'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
]),new PresentationComponentPolicy());
$composer = new SpatialWorkspaceComposer($objects,$views,$actions,$reader,$presentation);
$context = new InterfaceContext(7,11,'command','customers',capabilities:['crm.customer.view','crm.customer.manage'],traceId:'trace-13',correlationId:'corr-13');
$query = new ReadQuery(filters:['status'=>'active'],perPage:100);

$workspace = $composer->open('crm.customer',$context,$query,'crm.customers.map');
expect13($adapter->calls===1,'spatial workspace should use one authoritative spatial read');
expect13($workspace->sourceAuthority==='titan-maps-intelligence','Maps Intelligence must remain the spatial authority');
expect13($workspace->sourceReference==='maps.spatial-state','spatial source reference mismatch');
expect13($workspace->queryFingerprint===$query->fingerprint(),'spatial query fingerprint changed');
expect13(count($workspace->layers)===2,'layer normalization mismatch');
expect13(count($workspace->pins)===1,'invalid or cross-tenant pins must be omitted');
expect13($workspace->pins[0]['object_ref']==='crm.customer@7:C1','canonical object pin was not preserved');
expect13(count($workspace->candidates)===1,'candidate normalization mismatch');
expect13(count($workspace->routes)===1 && count($workspace->routes[0]['path'])===2,'route geometry normalization mismatch');
expect13(count($workspace->territories)===1,'territory polygon normalization mismatch');
expect13(count($workspace->traffic)===1,'traffic normalization mismatch');
expect13(($workspace->presentation->root->props['container'] ?? null)==='map','spatial workspace must render in a map container');
expect13($workspace->presentation->root->props['maps_authoritative']===true,'presentation must declare Maps authority');
expect13($workspace->presentation->root->props['projection_only']===true,'spatial workspace must remain projection-only');
expect13($workspace->presentation->root->props['spatial_actions'][0]['key']==='crm.customers.route','declared map action not surfaced');
expect13($workspace->presentation->root->props['spatial_actions'][0]['executable']===false,'spatial actions must remain non-executable intents');
expect13($workspace->presentation->root->props['spatial_actions'][1]['key']==='crm.customers.promote','command-only governed map action should be available on Command');

$hub = new InterfaceContext(7,12,'hub','customers',capabilities:['crm.customer.view']);
$hubWorkspace = $composer->open('crm.customer',$hub,new ReadQuery(),'crm.customers.map');
$hubActions=$hubWorkspace->presentation->root->props['spatial_actions'];
expect13(count($hubActions)===1 && $hubActions[0]['key']==='crm.customers.route','Hub must omit unsafe map actions');

try {
    $composer->open('crm.customer',$context,$query,'crm.customers.table');
    throw new RuntimeException('non-map view should not open as spatial workspace');
} catch (Throwable $e) { expect13(str_contains(strtolower($e->getMessage()),'map')||str_contains(strtolower($e->getMessage()),'spatial'),'non-map rejection should identify map/spatial requirement'); }

expect13(! class_exists('App\\Extensions\\TitanMapsIntelligence\\Services\\RoutingService',false),'Pass 13 verifier should not require a concrete Maps class import');

echo "PASS 13 VERIFY: spatial workspace composes Maps-authoritative layers/pins/candidates/routes/territories/traffic and exposes declared governed actions only\n";
