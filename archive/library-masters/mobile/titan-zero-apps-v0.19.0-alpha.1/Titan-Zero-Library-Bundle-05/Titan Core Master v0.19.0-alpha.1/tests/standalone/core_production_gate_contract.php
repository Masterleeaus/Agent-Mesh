<?php
$root=realpath(__DIR__.'/../..');
require_once $root.'/System/Contracts/SuiteProductionGate.php';
require_once $root.'/System/Services/DeterministicSuiteProductionGate.php';
use App\Extensions\TitanAppsCore\System\Services\DeterministicSuiteProductionGate;
$g=new DeterministicSuiteProductionGate();
$req=$g->requirements();
assert(count($req)>=12);
$profile=array_fill_keys(array_keys($req),true);
$all=[];
foreach(['zero','core','go','hub','interaction-engine','interface-runtime','builder','visual-runtime'] as $id)$all[$id]=$profile;
$r=$g->evaluate($all);
assert($r['ready']===true && $r['version_promotion_allowed']===true);
$all['hub']['host_boot']=false;
$r=$g->evaluate($all);
assert($r['ready']===false && in_array('hub:host_boot',$r['blocking_failures'],true));
echo "core_production_gate_contract: ok\n";
