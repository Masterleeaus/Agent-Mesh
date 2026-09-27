<?php

declare(strict_types=1);

$root=dirname(__DIR__);
spl_autoload_register(static function(string $class)use($root):void{$prefix='App\\Extensions\\TitanInterfaceRuntime\\';if(!str_starts_with($class,$prefix))return;$path=$root.'/'.str_replace('\\','/',substr($class,strlen($prefix))).'.php';if(is_file($path))require_once$path;});
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Governance\TitanAIGovernanceStateProvider;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernancePayloadNormalizer;

function e15ai(bool $ok,string $m):void{if(!$ok)throw new RuntimeException($m);}
$site=getenv('TITAN_WEBSITE_SNAPSHOT')?:'/mnt/data/website15';
$required=[
    'app/Extensions/TitanAI/System/Governance/Approvals/ApprovalQueue.php',
    'app/Extensions/TitanAI/System/Governance/Repositories/ActionReceiptRepository.php',
    'app/Extensions/TitanAI/System/Governance/Rollback/RollbackExecutionService.php',
    'app/Extensions/TitanAI/routes/user.php',
];
foreach($required as$f)e15ai(is_file($site.'/'.$f),"TitanAI snapshot missing {$f}");
$routes=(string)file_get_contents($site.'/app/Extensions/TitanAI/routes/user.php');
foreach(['approvals.approve','approvals.reject','receipts.rollback']as$name)e15ai(str_contains($routes,"name('{$name}')"),"TitanAI route {$name} missing");
$queueInterface=(string)file_get_contents($site.'/app/Extensions/TitanAI/System/Governance/Approvals/ApprovalQueue.php');
e15ai(str_contains($queueInterface,'function pending(int $companyId): array'),'TitanAI ApprovalQueue pending contract changed');
e15ai(str_contains($queueInterface,'function find(string $approvalId,int $companyId): ?array'),'TitanAI ApprovalQueue find contract changed');

$fakeQueue=new class{public function pending(int $companyId):array{return[ ['id'=>'approval-a','company_id'=>$companyId,'user_id'=>'5','action'=>'crm.work_order.reassign','domain'=>'crm','risk_level'=>'red','council_result'=>json_encode(['decision'=>'human_review','confidence'=>88,'approval_required'=>true,'findings'=>['schedule_conflict']],JSON_THROW_ON_ERROR),'status'=>'pending','resolved_by'=>null,'resolved_at'=>null,'resolution_note'=>null,'execution_started_at'=>null,'last_execution_error'=>null] ];}public function find(string $approvalId,int $companyId):?array{return null;}};
$container=new class($fakeQueue){public function __construct(private object $q){}public function bound(string $key):bool{return$key==='App\\Extensions\\TitanAI\\System\\Governance\\Approvals\\ApprovalQueue';}public function make(string $key):object{return$this->q;}};
$provider=new TitanAIGovernanceStateProvider($container);
$context=new InterfaceContext(7,5,'command','work',capabilities:['jobs.reassign'],traceId:'trace-ai15',correlationId:'corr-ai15');
$result=$provider->inspect($context,'jobs',['action_key'=>'jobs.reassign','capability_ref'=>'crm.work_order.reassign']);
e15ai($result->health->status==='healthy','TitanAI soft provider should read pending approval through ApprovalQueue');
$state=(new GovernancePayloadNormalizer())->normalize($result->payload);
e15ai($state['status']==='approval_required','TitanAI pending approval should map to approval_required');
e15ai(($state['risk']['level']??null)==='high','TitanAI red risk should normalize to high');
e15ai(abs((float)($state['assurance']['confidence']??0)-0.88)<0.0001,'TitanAI council confidence should normalize to 0..1');
e15ai(($state['approval']['approval_id']??null)==='approval-a','TitanAI approval id must survive safe mapping');
e15ai(($state['provenance']['authority']??null)==='titan-ai','TitanAI governance provenance must be explicit');

echo "PASS 15 TITANAI SNAPSHOT: current TitanAI approval/receipt/rollback contracts and soft approval-state adapter are compatible\n";
