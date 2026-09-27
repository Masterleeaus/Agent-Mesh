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
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceStateProviderContract;
use App\Extensions\TitanInterfaceRuntime\System\Governance\ContainerGovernanceStateGateway;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernanceProviderHealth;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernanceStateResult;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernanceWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;

function expect15(bool $condition, string $message): void { if (! $condition) throw new RuntimeException($message); }

$objects = new InMemoryObjectRegistry();
$objects->rebuild(['jobs'=>['contract_version'=>'1.1','objects'=>[[
    'key'=>'jobs.work-order','label'=>'Work Order','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],
    'product_surfaces'=>['command','go'],'customer_safe'=>false,'permissions'=>['jobs.view'],'facet_refs'=>[],
    'view_refs'=>[],'action_refs'=>['jobs.reassign'],'relationship_refs'=>[],'offline_mode'=>'read-only',
]],'relationships'=>[]]]);

$actions = new InMemoryActionRegistry($objects);
$actions->rebuild(['jobs'=>['schema_version'=>'1.1','actions'=>[[
    'key'=>'jobs.reassign','label'=>'Reassign worker','applies_to'=>['jobs.work-order'],'mutating'=>true,
    'capability_ref'=>'crm.work_order.reassign','interaction'=>null,'product_surfaces'=>['command','go'],
    'permissions'=>['jobs.reassign'],'offline_mode'=>'online-required','requires_confirmation'=>true,'container_hint'=>'panel','customer_safe'=>false,
]]]]);

$container = new class {
    /** @var array<string,object> */ private array $bindings=[];
    public function bind(string $key, object $service):void{$this->bindings[$key]=$service;}
    public function bound(string $key):bool{return isset($this->bindings[$key]);}
    public function make(string $key):object{return $this->bindings[$key] ?? throw new RuntimeException('unbound');}
};

$provider = new class implements GovernanceStateProviderContract {
    public string $mode='approval';
    public function inspect(InterfaceContext $context, string $providerKey, array $subject): GovernanceStateResult {
        if ($this->mode==='cross-tenant') {
            return new GovernanceStateResult($providerKey,'999',(string)$context->userId,new GovernanceProviderHealth($providerKey,'healthy','bad'),[],[]);
        }
        $payload = [
            'status'=>$this->mode==='executed'?'executed':'approval_required',
            'proposal'=>[
                'id'=>'proposal-77','title'=>'Reassign Job #77','summary'=>'Move the job from Chloe to Daniel.',
                'change_summary'=>['Worker: Chloe → Daniel','ETA: 10:55'],
            ],
            'risk'=>['level'=>'low','status'=>'assessed','reasons'=>['No customer time change'],'source_ref'=>'titan-risk'],
            'assurance'=>['status'=>'verified','level'=>'standard','confidence'=>0.96,'source_ref'=>'titan-assurance'],
            'autonomy'=>['level'=>'assist','status'=>'bounded','policy_ref'=>'jobs.reassign.v2','source_ref'=>'titan-autonomy'],
            'approval'=>[
                'required'=>true,'status'=>$this->mode==='executed'?'approved':'pending','approval_id'=>'approval-77',
                'source_ref'=>'titan-ai','decided_by'=>$this->mode==='executed'?'manager-11':null,
            ],
            'execution'=>[
                'status'=>$this->mode==='executed'?'succeeded':'not_started',
                'started_at'=>$this->mode==='executed'?'2026-08-18T10:00:00Z':null,
                'completed_at'=>$this->mode==='executed'?'2026-08-18T10:00:02Z':null,
            ],
            'receipt'=>$this->mode==='executed' ? [
                'receipt_id'=>'receipt-77','status'=>'executed','source_authority'=>'titan-ai',
                'correlation_id'=>$context->correlationId,'causation_id'=>'cause-77',
                'change_summary'=>['Worker reassigned to Daniel'],'rollback_available'=>true,
            ] : null,
            'rollback'=>$this->mode==='executed' ? [
                'available'=>true,'status'=>'available','source_ref'=>'titan-ai','reason'=>'Authoritative receipt includes a rollback contract.',
            ] : ['available'=>false,'status'=>'unavailable'],
            'provenance'=>['authority'=>'titan-ai','policy_version'=>'governance-v4','trace_id'=>$context->traceId],
        ];
        return new GovernanceStateResult($providerKey,(string)$context->companyId,(string)$context->userId,new GovernanceProviderHealth($providerKey,'healthy','ready'),$payload,['authority'=>'titan-ai']);
    }
};
$container->bind('titan.interface.governance.jobs',$provider);

$gateway = new ContainerGovernanceStateGateway($container);
$presentation = new BuilderPresentationAdapter(new ArrayComponentVocabulary([
    'approval-card'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'timeline'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'stack'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
]),new PresentationComponentPolicy());
$composer = new GovernanceWorkspaceComposer($objects,$actions,$gateway,$presentation);
$context = new InterfaceContext(7,11,'command','work',capabilities:['jobs.view','jobs.reassign'],traceId:'trace-15',correlationId:'corr-15');
$objectRef='jobs.work-order@7:WO77';

$approval = $composer->open($objectRef,'jobs.reassign',$context);
expect15($approval->status==='approval_required','governance status must come from source provider');
expect15(($approval->risk['level'] ?? null)==='low','risk must be visible');
expect15(($approval->assurance['status'] ?? null)==='verified','assurance must be visible');
expect15(($approval->autonomy['level'] ?? null)==='assist','autonomy must be visible');
expect15(($approval->approval['status'] ?? null)==='pending','approval requirement must be visible');
expect15($approval->receipt===null,'approval state should not fabricate an execution receipt');
expect15(($approval->policy['governance_calculated_locally'] ?? true)===false,'Interface Runtime must not calculate governance');
expect15(($approval->policy['auto_execute'] ?? true)===false,'governance presentation must never auto-execute');
$approvalOps=array_column($approval->actionIntents,'operation');
expect15(in_array('approve',$approvalOps,true) && in_array('reject',$approvalOps,true),'pending TitanAI approval must expose authoritative approve/reject handoffs');
foreach($approval->actionIntents as $intent) expect15(($intent['executable'] ?? true)===false,'governance actions must remain non-executable UI intents');

$provider->mode='executed';
$executed = $composer->open($objectRef,'jobs.reassign',$context,'receipt-77');
expect15($executed->receipt?->receiptId==='receipt-77','authoritative execution receipt missing');
expect15($executed->receipt?->correlationId==='corr-15','receipt correlation id must be visible');
expect15($executed->receipt?->isReversible()===true,'rollback availability must be visible from authoritative receipt/state');
expect15(($executed->rollback['available'] ?? false)===true,'rollback state missing');
$rollbackIntents=array_values(array_filter($executed->actionIntents,static fn(array $i):bool=>($i['operation']??null)==='rollback'));
expect15(count($rollbackIntents)===1,'executed reversible receipt must expose one rollback handoff');
expect15(($rollbackIntents[0]['handoff']['route_name'] ?? null)==='dashboard.user.titan-ai.governance.receipts.rollback','rollback must target authoritative TitanAI governance route');
expect15(($rollbackIntents[0]['handoff']['parameters']['receiptId'] ?? null)==='receipt-77','rollback route must be bound to authoritative receipt id');
expect15(($rollbackIntents[0]['handoff']['method'] ?? null)==='POST','rollback must be a protected POST handoff');
expect15(($rollbackIntents[0]['executable'] ?? true)===false,'rollback intent may not execute inside Interface Runtime');
expect15(($executed->presentation->root->props['receipt']['receipt_id'] ?? null)==='receipt-77','receipt must be rendered in trust workspace');
expect15(($executed->presentation->root->props['lifecycle'] ?? null)===['proposal','risk-assurance-autonomy','approval','execution','receipt','rollback'],'full governed lifecycle must be explicit');

$provider->mode='cross-tenant';
$degraded=$composer->open($objectRef,'jobs.reassign',$context);
expect15($degraded->providerStatus==='degraded','cross-tenant governance result must degrade');
expect15($degraded->actionIntents===[],'cross-tenant governance state must not produce action handoffs');
expect15($degraded->receipt===null,'cross-tenant governance receipt must not cross boundary');

$unauthorized = new InterfaceContext(7,12,'command','work',capabilities:['jobs.view']);
try { $composer->open($objectRef,'jobs.reassign',$unauthorized); throw new RuntimeException('unauthorized action should fail'); }
catch (Throwable $e) { expect15(str_contains(strtolower($e->getMessage()),'action') || str_contains(strtolower($e->getMessage()),'permission'),'unauthorized failure reason should be action/permission related'); }

echo "PASS 15 VERIFY: governance lifecycle renders authoritative risk/assurance/autonomy/approval/execution/receipt/rollback state with tenant-safe non-executable handoffs\n";
