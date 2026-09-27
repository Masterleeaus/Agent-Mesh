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

use App\Extensions\TitanInterfaceRuntime\System\Command\CommandSurface;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Inspector\ContextInspector;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryDomainRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryFacetRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Workspace\ObjectWorkspaceComposer;

function expect(bool $condition, string $message): void {
    if (! $condition) throw new RuntimeException($message);
}

$object = [
    'key'=>'crm.customer','label'=>'Customer','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],
    'product_surfaces'=>['command','hub'],'customer_safe'=>true,'permissions'=>['crm.customer.view'],'lifecycle_ref'=>null,
    'facet_refs'=>[],'view_refs'=>[],'action_refs'=>['crm.customer.edit','crm.customer.contact','crm.customer.owner-note'],'relationship_refs'=>[],'offline_mode'=>'read-only',
];
$domains = new InMemoryDomainRegistry();
$domains->rebuild(['crm'=>['domains'=>[[
    'key'=>'customers','label'=>'Customers','layer'=>'business','product_surfaces'=>['command','hub'],
    'intent_surfaces'=>['home','ask','work','do','explore','data'],'object_refs'=>['crm.customer'],'default_view_refs'=>[],'priority'=>10,
]]]]);
$objects = new InMemoryObjectRegistry();
$objects->rebuild(['crm'=>['objects'=>[$object]]]);
$facets = new InMemoryFacetRegistry($objects);
$facets->rebuild(['crm'=>['facets'=>[]]]);
$actions = new InMemoryActionRegistry($objects);
$actions->rebuild(['crm'=>['actions'=>[
    ['key'=>'crm.customer.edit','label'=>'Edit customer','applies_to'=>['crm.customer'],'mutating'=>true,'capability_ref'=>'crm.customer.update','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['crm.customer.update'],'offline_mode'=>'online-required','requires_confirmation'=>false,'container_hint'=>'drawer'],
    ['key'=>'crm.customer.contact','label'=>'Contact customer','applies_to'=>['crm.customer'],'mutating'=>true,'capability_ref'=>null,'interaction'=>['kind'=>'wizard','ref'=>'crm-contact-v1'],'product_surfaces'=>['command','hub'],'permissions'=>['crm.customer.contact'],'offline_mode'=>'queueable','requires_confirmation'=>false,'container_hint'=>'panel'],
    ['key'=>'crm.customer.owner-note','label'=>'Owner note','applies_to'=>['crm.customer'],'mutating'=>false,'capability_ref'=>null,'interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['crm.owner-note.view'],'offline_mode'=>'local-safe','requires_confirmation'=>false,'container_hint'=>'drawer'],
]]]);

$vocabulary = new ArrayComponentVocabulary([
    'drawer'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'command-palette'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'stack'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
]);
$builder = new BuilderPresentationAdapter($vocabulary, new PresentationComponentPolicy());
$workspace = new ObjectWorkspaceComposer($objects, $facets);
$inspector = new ContextInspector($objects, $domains, $actions, $workspace, $builder);

$context = new InterfaceContext(7, 11, 'command', 'customers', capabilities:['crm.customer.view','crm.customer.update','crm.customer.contact']);
$snapshot = $inspector->inspect(ObjectReference::parse('crm.customer@7:C1'), $context);
expect($snapshot->object->reference->canonical() === 'crm.customer@7:C1', 'inspector canonical object mismatch');
expect($snapshot->context->objectRef === 'crm.customer@7:C1', 'inspector must preserve object in child context');
expect($snapshot->context->domain === 'customers', 'inspector must preserve/infer domain');
expect($snapshot->context->traceId === $context->traceId && $snapshot->context->correlationId === $context->correlationId, 'inspector must preserve trace identity');
expect(array_map(fn($a)=>$a->actionKey,$snapshot->actions) === ['crm.customer.contact','crm.customer.edit'], 'inspector action permission filtering mismatch');
expect($snapshot->actions[0]->executable === false && $snapshot->actions[1]->executable === false, 'inspector actions must remain non-executable intents');
expect($snapshot->workspaceTarget->kind === 'workspace' && $snapshot->workspaceTarget->objectRef === 'crm.customer@7:C1', 'workspace escalation target missing');
expect($snapshot->presentation->root->type === 'component', 'inspector presentation missing');

$hub = new InterfaceContext(7, 12, 'hub', 'customers', capabilities:['crm.customer.view','crm.customer.contact']);
$hubSnapshot = $inspector->inspect(ObjectReference::parse('crm.customer@7:C2'), $hub);
expect(array_map(fn($a)=>$a->actionKey,$hubSnapshot->actions) === ['crm.customer.contact'], 'Hub must not receive owner-only actions');

try {
    $inspector->inspect(ObjectReference::parse('crm.customer@8:C3'), $context);
    throw new RuntimeException('cross-tenant inspector reference should have failed');
} catch (Throwable $e) {
    expect(str_contains($e->getMessage(), 'tenant'), 'cross-tenant inspector failure should mention tenant');
}

$commands = new CommandSurface($domains, $inspector, $builder, 30);
$all = $commands->search('', $context);
expect($all->authority === 'presentation-only', 'command surface must be presentation-only');
expect(in_array('ask', array_map(fn($i)=>$i->kind,$all->items), true), 'Ask command missing');
expect(in_array('navigate', array_map(fn($i)=>$i->kind,$all->items), true), 'Navigation command missing');

$objectContext = $snapshot->context;
$objectCommands = $commands->search('customer', $objectContext);
$kinds = array_map(fn($i)=>$i->kind,$objectCommands->items);
expect(in_array('inspect', $kinds, true), 'Inspect command missing for current object');
expect(in_array('workspace', $kinds, true), 'Full workspace escalation command missing');
expect(in_array('action', $kinds, true), 'Permitted object action command missing');
foreach ($objectCommands->items as $item) expect($item->executable === false, 'command items must never be locally executable');

$ask = $commands->search('why are jobs late', $context);
$askItems = array_values(array_filter($ask->items, fn($i)=>$i->kind==='ask'));
expect($askItems !== [] && $askItems[0]->intent['query'] === 'why are jobs late', 'Ask query intent mismatch');

$limited = $commands->search('', $context, 2);
expect(count($limited->items) <= 2 && $limited->truncated === true, 'command result limit/truncation mismatch');


$validator = new App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionValidator();
$crossContribution = [
    'schema_version'=>'1.0','extension_key'=>'connect',
    'context'=>['required'=>['company_id','user_id','product_surface','domain'],'optional'=>[]],
    'domains'=>[['key'=>'connect','label'=>'Connect','layer'=>'business','product_surfaces'=>['command','hub'],'intent_surfaces'=>['home','ask'],'object_refs'=>[],'default_view_refs'=>[]]],'objects'=>[],'facets'=>[],'views'=>[],
    'actions'=>[[
        'key'=>'connect.message-customer','label'=>'Message customer','applies_to'=>['crm.customer'],'mutating'=>true,
        'capability_ref'=>null,'interaction'=>['kind'=>'wizard','ref'=>'connect-message-v1'],'product_surfaces'=>['command','hub'],
        'permissions'=>['messages.send'],'offline_mode'=>'queueable','requires_confirmation'=>false,'container_hint'=>'panel',
    ]],
    'lifecycles'=>[],'global_work'=>[],
    'providers'=>['attention'=>[],'decisions'=>[],'insights'=>[]],
    'legacy_data_surfaces'=>[],
];
$validation=$validator->validate($crossContribution,'connect');
expect($validation->valid(), 'cross-extension action applies_to should be accepted syntactically and globally validated by Action Registry');

echo "PASS 11 VERIFY: inspector/action/command surface safety and context preservation\n";
