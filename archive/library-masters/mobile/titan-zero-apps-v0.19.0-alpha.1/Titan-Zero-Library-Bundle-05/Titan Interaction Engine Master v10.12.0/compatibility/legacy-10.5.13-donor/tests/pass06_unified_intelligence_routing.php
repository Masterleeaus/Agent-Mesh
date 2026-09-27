<?php
declare(strict_types=1);
$root=dirname(__DIR__);
spl_autoload_register(function(string $class) use($root): void { $p='App\\Extensions\\InteractionEngine\\System\\'; if(str_starts_with($class,$p)){ $f=$root.'/System/'.str_replace('\\','/',substr($class,strlen($p))).'.php'; if(is_file($f)) require_once $f; }});
use App\Extensions\InteractionEngine\System\Contracts\TitanAppsIntelligenceRoutingContract;
use App\Extensions\InteractionEngine\System\Runtime\TitanAppsIntelligenceRouter;
$f=0;$check=function(bool $v,string $m)use(&$f){if(!$v){$f++;fwrite(STDERR,"FAIL $m\n");}};
$router=new TitanAppsIntelligenceRouter();
$check($router instanceof TitanAppsIntelligenceRoutingContract,'public routing contract');
$r=$router->select(['company_id'=>'42','task'=>'embedding','privacy'=>'local_only','confidence'=>0.8,'consequence'=>'low'],['deterministic'=>false,'browser_ai'=>true,'device_ai'=>true,'byo_cloud'=>true,'titan_private_ai'=>true]);
$check(($r['route']??null)==='browser_ai','local-only prefers browser over external');
$check(($r['company_id']??null)==='42','company_id is canonical boundary');
$check(($r['external_inference']??true)===false,'browser route is local execution');
$r=$router->select(['company_id'=>42,'task'=>'reasoning','privacy'=>'private_preferred','confidence'=>0.2,'consequence'=>'high'],['model_council'=>true,'titan_private_ai'=>true]);
$check(($r['route']??null)==='model_council','high consequence low confidence escalates to council');
$check(($r['grants_authority']??true)===false && ($r['executes_mutations']??true)===false,'routing grants no authority');
$r=$router->select(['company_id'=>'42','task'=>'reasoning','privacy'=>'local_only'],['byo_cloud'=>true,'titan_private_ai'=>true,'model_council'=>true]);
$check(($r['route']??null)==='unavailable','local-only fails closed without local route');
try{$router->select(['tenant_id'=>'42','task'=>'reasoning'],['deterministic'=>true]);$f++;fwrite(STDERR,"FAIL legacy tenant cannot replace company_id\n");}catch(InvalidArgumentException $e){}
try{$router->select(['company_id'=>'42','tenant_id'=>'99','task'=>'reasoning'],['deterministic'=>true]);$f++;fwrite(STDERR,"FAIL conflicting tenant alias rejected\n");}catch(InvalidArgumentException $e){}
if($f) exit(1); echo "PASS pass06 unified intelligence routing\n";
