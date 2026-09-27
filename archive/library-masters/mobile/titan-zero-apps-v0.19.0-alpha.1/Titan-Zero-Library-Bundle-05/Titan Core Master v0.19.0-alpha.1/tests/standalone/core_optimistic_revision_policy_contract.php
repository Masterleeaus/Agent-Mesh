<?php
$root=realpath(__DIR__.'/../..');
$p=$root.'/System/Support/AppOptimisticRevisionPolicy.php';
assert(is_file($p));
require_once $p;
use App\Extensions\TitanAppsCore\System\Support\AppOptimisticRevisionPolicy;

$r=new AppOptimisticRevisionPolicy('test_revision_conflict');
assert($r->assertNext(null,1)===1);
assert($r->assertNext(3,4)===4);
try{$r->assertNext(3,3);assert(false);}catch(RuntimeException $e){assert($e->getMessage()==='test_revision_conflict');}
echo "core_optimistic_revision_policy_contract: ok\n";
