<?php
$root=realpath(__DIR__.'/../..');
$p=$root.'/System/Services/AppOperationActivityPolicy.php';
assert(is_file($p));
require_once $p;
use App\Extensions\TitanAppsCore\System\Services\AppOperationActivityPolicy;
$x=new AppOperationActivityPolicy();
assert($x->category(['status'=>'offline_deferred'])==='queued');
assert($x->category(['status'=>'pending_approval'])==='attention');
assert($x->category(['status'=>'executed','metadata'=>['terminal'=>false]])==='active');
assert($x->category(['status'=>'executed','metadata'=>['terminal'=>true]])==='completed');
assert($x->category(['status'=>'failed'])==='attention');
assert($x->isResumable(['status'=>'offline_deferred'])===true);
assert($x->isResumable(['status'=>'failed'])===true);
echo "core_operation_activity_policy_contract: ok\n";
