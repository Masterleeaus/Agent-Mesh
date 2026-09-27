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
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Decision\DecisionProviderContract;
use App\Extensions\TitanInterfaceRuntime\System\Decision\ContainerDecisionProviderGateway;
use App\Extensions\TitanInterfaceRuntime\System\Decision\DecisionProviderHealth;
use App\Extensions\TitanInterfaceRuntime\System\Decision\DecisionProviderResult;
use App\Extensions\TitanInterfaceRuntime\System\Decision\DecisionWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryDecisionProviderRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;

function expect14(bool $condition, string $message): void { if (! $condition) throw new RuntimeException($message); }

$objects = new InMemoryObjectRegistry();
$objects->rebuild(['finance'=>['contract_version'=>'1.1','objects'=>[[
    'key'=>'finance.quote','label'=>'Quote','data_authority'=>'titan-financial-engine','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],
    'product_surfaces'=>['command','hub'],'customer_safe'=>true,'permissions'=>['finance.quote.view'],'facet_refs'=>[],
    'view_refs'=>['finance.quote.scenario'],'action_refs'=>['finance.quote.approve','finance.quote.modify'],'relationship_refs'=>[],'offline_mode'=>'read-only',
]],'relationships'=>[]]]);

$views = new InMemoryViewRegistry($objects);
$views->rebuild(['finance'=>['views'=>[[
    'key'=>'finance.quote.scenario','label'=>'Quote options','kind'=>'scenario','applies_to'=>['finance.quote'],
    'product_surfaces'=>['command','hub'],'customer_safe'=>true,'permissions'=>['finance.quote.view'],
    'data_source'=>['authority'=>'titan-financial-engine','mode'=>'read-model','reference'=>'quote.scenarios'],
    'component_hint'=>'approval-card',
]]]]);

$actions = new InMemoryActionRegistry($objects);
$actions->rebuild(['finance'=>['schema_version'=>'1.1','actions'=>[
    [
        'key'=>'finance.quote.approve','label'=>'Approve quote option','applies_to'=>['finance.quote'],'mutating'=>true,
        'capability_ref'=>'finance.quote.approve','interaction'=>null,'product_surfaces'=>['command','hub'],
        'permissions'=>['finance.quote.approve'],'offline_mode'=>'online-required','requires_confirmation'=>true,'container_hint'=>'panel','customer_safe'=>true,
    ],
    [
        'key'=>'finance.quote.modify','label'=>'Modify assumptions','applies_to'=>['finance.quote'],'mutating'=>true,
        'capability_ref'=>null,'interaction'=>['kind'=>'wizard','ref'=>'quote_assumptions_v1'],'product_surfaces'=>['command'],
        'permissions'=>['finance.quote.manage'],'offline_mode'=>'online-required','requires_confirmation'=>false,'container_hint'=>'full-workspace','customer_safe'=>false,
    ],
]]]);

$providers = new InMemoryDecisionProviderRegistry($objects, $actions);
$providers->rebuild(['finance'=>['providers'=>['attention'=>[],'decisions'=>[[
    'key'=>'quote-advisor','object_refs'=>['finance.quote'],'source_ref'=>'financial.quote-advisor','action_refs'=>['finance.quote.approve','finance.quote.modify'],
]],'insights'=>[]]]]);

$readAdapter = new class implements ReadAuthorityAdapterContract {
    public int $calls = 0;
    public function supports(string $authority,string $mode):bool { return $authority==='titan-financial-engine' && $mode==='read-model'; }
    public function read(InterfaceContext $context,string $authority,string $reference,array $criteria=[]):AuthorityReadResult {
        $this->calls++;
        return new AuthorityReadResult($authority,$reference,[
            'observations'=>[
                ['key'=>'margin-floor','label'=>'Margin floor','value'=>'35%','source_ref'=>'pricing-policy'],
            ],
            'assumptions'=>[
                ['key'=>'labour-hours','label'=>'Labour hours','value'=>6,'source_ref'=>'quote-calculation','editable'=>true],
            ],
            'recommendations'=>[
                ['key'=>'recommend-b','label'=>'Prefer Option B','summary'=>'Best balance of margin and customer price.','confidence'=>0.82,'scenario_ref'=>'option-b'],
            ],
            'scenarios'=>[
                ['key'=>'option-a','label'=>'Option A','recommended'=>false,'summary'=>'Lower price','outcomes'=>[['key'=>'price','label'=>'Price','value'=>780],['key'=>'margin','label'=>'Margin','value'=>'37%']],'consequences'=>['Lower margin'],'action_ref'=>'finance.quote.approve'],
                ['key'=>'option-b','label'=>'Option B','recommended'=>true,'summary'=>'Balanced','outcomes'=>[['key'=>'price','label'=>'Price','value'=>850],['key'=>'margin','label'=>'Margin','value'=>'42%']],'consequences'=>['Higher customer price'],'action_ref'=>'finance.quote.approve'],
            ],
        ],['source'=>'titan-financial-engine','calculation_run'=>'calc-77','trace_id'=>$context->traceId]);
    }
};

$container = new class {
    /** @var array<string,object> */ private array $bindings=[];
    public function bind(string $key, object $service):void{$this->bindings[$key]=$service;}
    public function bound(string $key):bool{return isset($this->bindings[$key]);}
    public function make(string $key):object{return $this->bindings[$key] ?? throw new RuntimeException('unbound');}
};
$provider = new class implements DecisionProviderContract {
    public function fetch(InterfaceContext $context, string $providerKey, array $criteria=[]):DecisionProviderResult {
        return new DecisionProviderResult(
            providerKey:$providerKey,companyId:(string)$context->companyId,userId:(string)$context->userId,
            health:new DecisionProviderHealth($providerKey,'healthy','ready'),
            payload:[
                'observations'=>[['key'=>'schedule-risk','label'=>'Scheduling','value'=>'Low risk','source_ref'=>'scheduler']],
                'recommendations'=>[['key'=>'schedule-note','label'=>'Scheduling fit','summary'=>'Option B preserves the preferred booking window.','confidence'=>0.76,'scenario_ref'=>'option-b']],
            ],
            provenance:['authority'=>'titan-scheduler','model'=>'schedule-fit-v2'],
        );
    }
};
$container->bind('titan.interface.decision.finance.quote-advisor',$provider);
$gateway = new ContainerDecisionProviderGateway($container);
$reader = new AuthorizedViewReader($views,new ReadAuthorityRouter([$readAdapter],new InMemoryReadCache()));
$presentation = new BuilderPresentationAdapter(new ArrayComponentVocabulary([
    'approval-card'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'stack'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
]),new PresentationComponentPolicy());
$composer = new DecisionWorkspaceComposer($objects,$views,$actions,$providers,$gateway,$reader,$presentation);
$context = new InterfaceContext(7,11,'command','money',capabilities:['finance.quote.view','finance.quote.approve','finance.quote.manage'],traceId:'trace-14',correlationId:'corr-14');
$query = new ReadQuery(filters:['quote_id'=>'Q77']);
$workspace = $composer->open('finance.quote',$context,$query,'finance.quote.scenario');

expect14($readAdapter->calls===1,'scenario workspace should perform one authoritative scenario-view read');
expect14($workspace->queryFingerprint===$query->fingerprint(),'scenario query fingerprint changed');
expect14(count($workspace->observations)===2,'view and provider observations should compose');
expect14(count($workspace->recommendations)===2,'view and provider recommendations should compose');
expect14(count($workspace->scenarios)===2,'scenario choices missing');
expect14($workspace->scenarios[1]['recommended']===true,'authoritative recommendation marker missing');
expect14($workspace->policy['recommendation_is_not_execution']===true,'recommendations must be separated from execution');
expect14($workspace->policy['auto_execute']===false,'rendering a recommendation must never auto-execute');
expect14($workspace->decisionIntents[0]['executable']===false,'decision choices must be non-executable intents');
expect14($workspace->decisionIntents[0]['requires_confirmation']===true,'action confirmation policy must be preserved');
expect14(($workspace->presentation->root->props['decision_policy']['auto_execute'] ?? null)===false,'presentation must carry no-auto-execute policy');
expect14(($workspace->presentation->root->props['layers'] ?? null)===['observation','recommendation','scenario','choice'],'decision layers must remain explicit');
expect14(count($workspace->sources)===2,'source/provenance from view and decision provider must both be visible');

$hub = new InterfaceContext(7,12,'hub','money',capabilities:['finance.quote.view','finance.quote.approve']);
$hubWorkspace = $composer->open('finance.quote',$hub,new ReadQuery(),'finance.quote.scenario');
$intentKeys=array_column($hubWorkspace->decisionIntents,'key');
expect14(in_array('finance.quote.approve',$intentKeys,true),'Hub-safe approve action should remain visible');
expect14(!in_array('finance.quote.modify',$intentKeys,true),'unsafe command-only modify action must not leak to Hub');

$crossTenantProvider = new class implements DecisionProviderContract {
    public function fetch(InterfaceContext $context,string $providerKey,array $criteria=[]):DecisionProviderResult {
        return new DecisionProviderResult($providerKey,'999',(string)$context->userId,new DecisionProviderHealth($providerKey,'healthy','bad'),['observations'=>[]],[]);
    }
};
$container->bind('titan.interface.decision.finance.quote-advisor',$crossTenantProvider);
$degraded = $composer->open('finance.quote',$context,new ReadQuery(),'finance.quote.scenario');
expect14($degraded->providerStatus==='degraded','cross-tenant provider result must degrade rather than contaminate the workspace');
expect14(count($degraded->sources)===1,'cross-tenant provider provenance must be excluded');

foreach ($workspace->decisionIntents as $intent) expect14(($intent['executable'] ?? true)===false,'no scenario intent may be executable inside Interface Runtime');

echo "PASS 14 VERIFY: Decide/Scenario workspace separates observations, recommendations, scenarios and governed non-executable choices with provenance and Hub safety\n";
