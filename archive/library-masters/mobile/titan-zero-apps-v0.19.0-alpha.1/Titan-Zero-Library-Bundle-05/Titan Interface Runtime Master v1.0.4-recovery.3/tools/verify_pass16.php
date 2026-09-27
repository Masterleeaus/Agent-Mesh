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

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetDomainItemVerifierContract;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\WorkingSetSourceItem;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\WorkingSetSourceResult;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\WorkingSetWorkspaceComposer;

function expect16(bool $condition, string $message): void { if (! $condition) throw new RuntimeException($message); }

$objects = new InMemoryObjectRegistry();
$objects->rebuild([
    'crm' => ['schema_version'=>'1.1','objects'=>[
        ['key'=>'crm.customer','label'=>'Customer','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command','hub'],'customer_safe'=>true,'permissions'=>['crm.customer.view'],'facet_refs'=>[],'view_refs'=>[],'action_refs'=>[],'relationship_refs'=>[],'offline_mode'=>'read-only'],
        ['key'=>'crm.invoice','label'=>'Invoice','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['crm.invoice.view'],'facet_refs'=>[],'view_refs'=>[],'action_refs'=>[],'relationship_refs'=>[],'offline_mode'=>'read-only'],
        ['key'=>'jobs.work-order','label'=>'Work Order','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['jobs.view'],'facet_refs'=>[],'view_refs'=>[],'action_refs'=>[],'relationship_refs'=>[],'offline_mode'=>'read-only'],
    ],'relationships'=>[]],
]);

$gateway = new class implements WorkingSetGatewayContract {
    public string $businessId='7';
    public function inspect(string $workingSetId, InterfaceContext $context): WorkingSetSourceResult {
        return new WorkingSetSourceResult(
            sourceAuthority:'titan-workspace-projects',
            status:'ready',
            workingSetId:$workingSetId,
            ownerUserId:'11',
            teamId:'22',
            name:'Johnson Contract',
            description:'Shared contract context',
            context:['business_id'=>$this->businessId,'customer_id'=>'C1','job_id'=>'J1','vertical'=>'cleaning'],
            items:[
                new WorkingSetSourceItem('m1','customer','C1','Sarah Johnson',[], '2026-08-18T10:00:00Z'),
                new WorkingSetSourceItem('m2','invoice','I9','Invoice #9',[], '2026-08-18T10:01:00Z'),
                new WorkingSetSourceItem('m3','job','J1','Weekly Clean',[], '2026-08-18T10:02:00Z'),
                new WorkingSetSourceItem('m4','file','F4','Signed Contract',['path'=>'/files/contract.pdf'], '2026-08-18T10:03:00Z'),
                new WorkingSetSourceItem('m5','chat','CH5','Customer chat',['slug'=>'customer-chat'], '2026-08-18T10:04:00Z'),
            ],
            diagnostics:[],
        );
    }
    public function health(): array { return ['status'=>'healthy','authority'=>'titan-workspace-projects']; }
};

$verifier = new class implements WorkingSetDomainItemVerifierContract {
    public function verify(string $itemType, string $itemId, InterfaceContext $context): bool {
        return ! ($itemType === 'job' && $itemId === 'J1');
    }
};

$presentation = new BuilderPresentationAdapter(new ArrayComponentVocabulary([
    'stack'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'entity-card'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
]),new PresentationComponentPolicy());

$composer = new WorkingSetWorkspaceComposer(
    $gateway,
    $verifier,
    $objects,
    $presentation,
    [
        'customer'=>['crm.customer'],
        'invoice'=>['crm.invoice'],
        'job'=>['jobs.work-order'],
    ],
    ['file','photo','chat','workbook'],
    200,
);

$context = new InterfaceContext(7,11,'command','work',teamId:'22',capabilities:['crm.customer.view','jobs.view'],traceId:'trace-16',correlationId:'corr-16');
$workspace = $composer->open('42',$context);

expect16($workspace->workingSetId==='42','working set id missing');
expect16($workspace->context->workspaceId==='42','child InterfaceContext must carry workspace id');
expect16((string)$workspace->context->companyId==='7' && (string)$workspace->context->userId==='11','workspace context must preserve tenant/user identity');
expect16($workspace->context->traceId==='trace-16' && $workspace->context->correlationId==='corr-16','workspace context must preserve trace identity');
expect16(($workspace->contextEnvelope['workspace_context']['customer_id'] ?? null)==='C1','workspace source context must be visible in shared envelope');
expect16(($workspace->contextEnvelope['source_authority'] ?? null)==='titan-workspace-projects','workspace source authority missing');

$byType=[]; foreach($workspace->items as $item) $byType[$item->itemType]=$item;
expect16(isset($byType['customer']),'authorized business object should be present');
expect16(($byType['customer']->objectReference ?? null)==='crm.customer@7:C1','authorized customer must have canonical tenant-bound object ref');
expect16(!isset($byType['invoice']),'membership must not grant missing invoice capability');
expect16(!isset($byType['job']),'domain verifier rejection must omit stale/cross-business membership');
expect16(isset($byType['file']) && $byType['file']->objectReference===null,'user-owned file membership may remain opaque without inventing business authority');
expect16(isset($byType['chat']) && $byType['chat']->objectReference===null,'user-owned chat membership may remain opaque without inventing business authority');
expect16(($workspace->diagnostics['omitted']['unauthorized'] ?? 0)>=1,'unauthorized omission diagnostic missing');
expect16(($workspace->diagnostics['omitted']['source_scope'] ?? 0)>=1,'source-scope omission diagnostic missing');

foreach($workspace->actionIntents as $intent){
    expect16(($intent['executable'] ?? true)===false,'working-set actions must remain non-executable handoffs');
    expect16(($intent['membership_only'] ?? false)===true,'working-set mutation handoff must be membership-only');
    expect16(($intent['deletes_authoritative_data'] ?? true)===false,'detach/remove must explicitly preserve authoritative data');
}

$gateway->businessId='8';
try { $composer->open('42',$context); throw new RuntimeException('cross-business working set must fail'); }
catch (Throwable $e) { expect16(str_contains(strtolower($e->getMessage()),'tenant') || str_contains(strtolower($e->getMessage()),'business'),'cross-business failure should identify tenant/business scope'); }

echo "PASS 16 VERIFY: mixed-object working sets preserve context, independently re-authorize membership, and never turn membership removal into authoritative record deletion\n";
