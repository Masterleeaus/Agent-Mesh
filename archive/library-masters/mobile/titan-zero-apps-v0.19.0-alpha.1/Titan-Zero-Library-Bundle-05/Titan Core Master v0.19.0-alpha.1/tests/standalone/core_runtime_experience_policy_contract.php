<?php
$root=realpath(__DIR__.'/../..');
$p=$root.'/System/Services/AppRuntimeExperiencePolicy.php';
assert(is_file($p));
require_once $p;
use App\Extensions\TitanAppsCore\System\Services\AppRuntimeExperiencePolicy;

$x=new AppRuntimeExperiencePolicy();
assert($x->evaluate(true,true,true)['state']==='online');
assert($x->evaluate(false,true,true)['state']==='degraded');
assert($x->evaluate(true,false,true)['state']==='offline');
assert($x->evaluate(false,false,false)['state']==='unavailable');
assert($x->evaluate(true,false,true)['authority_increase']===false);
echo "core_runtime_experience_policy_contract: ok\n";
