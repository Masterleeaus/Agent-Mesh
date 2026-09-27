<?php
declare(strict_types=1);
$root=dirname(__DIR__);
spl_autoload_register(function($c)use($root){$p='App\\Extensions\\TitanGo\\';if(str_starts_with($c,$p)){$f=$root.'/'.str_replace('\\','/',substr($c,strlen($p))).'.php';if(is_file($f))require_once$f;}});
use App\Extensions\TitanGo\System\Offline\GoOfflineOperation;
use App\Extensions\TitanGo\System\Offline\GoOfflineReplayPolicy;
use App\Extensions\TitanGo\System\Integration\TitanFieldMobileGateway;
$failed=[];$pass=function(bool $ok,string $m)use(&$failed){echo($ok?'PASS ':'FAIL ').$m."\n";if(!$ok)$failed[]=$m;};
$policy=new GoOfflineReplayPolicy(new TitanFieldMobileGateway());
$valid=new GoOfflineOperation('c1','u1','d1','work_order.note','op1',date(DATE_ATOM),['note'=>'safe'],1,'work_order','wo1',['correlation_id'=>'corr']);
$policy->validate($valid);$pass(true,'bounded JSON-safe offline envelope accepted');
$cases=[
 new GoOfflineOperation('c1','u1','d1','work_order.note','op2',date(DATE_ATOM),['bad'=>(object)['x'=>1]]),
 new GoOfflineOperation('c1','u1','d1','work_order.note','op3',date(DATE_ATOM),[],null,null,null,['accessToken'=>'secret']),
 new GoOfflineOperation('c1','u1','d1','work_order.note','op4',date(DATE_ATOM),[],null,null,null,['nested'=>['permissions'=>['admin']]]),
];
foreach($cases as $i=>$op){try{$policy->validate($op);$pass(false,'unsafe offline envelope '.($i+1).' rejected');}catch(InvalidArgumentException){$pass(true,'unsafe offline envelope '.($i+1).' rejected');}}
try{$op=new GoOfflineOperation(str_repeat('c',256),'u','d','work_order.note','op5',date(DATE_ATOM),[]);$policy->validate($op);$pass(false,'oversized identifier rejected');}catch(InvalidArgumentException){$pass(true,'oversized identifier rejected');}
exit($failed?1:0);
