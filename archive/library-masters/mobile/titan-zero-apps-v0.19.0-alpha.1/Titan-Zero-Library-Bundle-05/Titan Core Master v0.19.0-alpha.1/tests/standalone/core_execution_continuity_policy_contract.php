<?php
$root=realpath(__DIR__.'/../..');
$p=$root.'/System/Services/AppExecutionContinuityPolicy.php';
assert(is_file($p));
require_once $p;
use App\Extensions\TitanAppsCore\System\Services\AppExecutionContinuityPolicy;
$x=new AppExecutionContinuityPolicy();
assert($x->workspaceState(['status'=>'executed'])==='monitoring');
assert($x->workspaceState(['status'=>'pending_approval'])==='awaiting_decision');
assert($x->workspaceState(['status'=>'offline_deferred'])==='monitoring');
assert($x->workspaceState(['status'=>'failed'])==='presenting');
assert($x->terminal(['status'=>'executed','metadata'=>['terminal'=>true]])===true);
assert($x->receiptId(['metadata'=>['receipt_id'=>'r1']])==='r1');
assert($x->rollbackCapability(['data'=>['rollback_capability'=>'crm.undo']])==='crm.undo');
echo "core_execution_continuity_policy_contract: ok\n";
