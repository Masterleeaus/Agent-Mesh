<?php
$root=realpath(__DIR__.'/..');
require_once $root.'/System/Contracts/GovernedOperationLedgerInterface.php';
require_once $root.'/System/Contracts/GovernedOperationActivityGatewayInterface.php';
require_once $root.'/System/Operations/InMemoryGovernedOperationLedger.php';
require_once $root.'/System/Operations/GovernedOperationActivityGateway.php';
use App\Extensions\InteractionEngine\System\Operations\{InMemoryGovernedOperationLedger,GovernedOperationActivityGateway};

$l=new InMemoryGovernedOperationLedger();
$l->record('7','op-a',['actor_id'=>'9','status'=>'offline_deferred','capability'=>'field.job.update','source_surface'=>'zero']);
$l->record('7','op-b',['actor_id'=>'10','status'=>'executed','capability'=>'crm.customer.update','source_surface'=>'zero']);
$g=new GovernedOperationActivityGateway($l);
$actor=$g->list(['company_id'=>7,'actor_id'=>9]);
assert(count($actor)===1 && $actor[0]['operation_id']==='op-a');
$company=$g->list(['company_id'=>7,'actor_id'=>9,'operation_scope'=>'company']);
assert(count($company)===2);
$updated=$g->observe('op-a',['status'=>'monitoring','receipt_id'=>'r1'],['company_id'=>7,'actor_id'=>9]);
assert($updated['status']==='monitoring' && $updated['receipt_id']==='r1');
try{$g->find('op-b',['company_id'=>7,'actor_id'=>9]);assert(false);}catch(RuntimeException $e){assert($e->getMessage()==='governed_operation_actor_scope_violation');}
echo "governed_operation_activity_behavior: ok\n";
