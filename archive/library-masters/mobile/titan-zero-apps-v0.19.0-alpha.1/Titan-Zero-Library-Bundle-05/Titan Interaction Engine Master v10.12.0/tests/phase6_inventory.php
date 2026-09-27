<?php
declare(strict_types=1);
$root=dirname(__DIR__);$fail=0;$n=0;$check=function(bool$c,string$m)use(&$fail,&$n){$n++;echo($c?'PASS ':'FAIL ').$m."\n";if(!$c)$fail++;};
$check(count(glob($root.'/resources/wizards/*.json')?:[])===30,'exactly 30 wizard definitions preserved');
$check(count(glob($root.'/resources/templates/*.json')?:[])===38,'exactly 38 template definitions preserved');
$catalog=json_decode((string)file_get_contents($root.'/resources/onboarding/field-home-services-question-catalog.json'),true);$check(is_array($catalog)&&count($catalog)===121,'source onboarding catalogue remains exactly 121 entries');
$wizard=json_decode((string)file_get_contents($root.'/resources/wizards/field_home_services_onboarding.json'),true);$steps=(array)($wizard['wizard']['steps']??[]);$questions=0;foreach($steps as$s)$questions+=count((array)($s['fields']??[]));$check(count($steps)===16,'runtime onboarding remains 16 sections');$check($questions===116,'runtime onboarding remains exactly 116 questions');
$contracts=glob($root.'/System/Engines/*/Contracts/*Interface.php')?:[];$impl=glob($root.'/System/Engines/*/Implementations/*.php')?:[];$check(count($contracts)===80,'80-engine contract library preserved');$check(count($impl)===80,'80-engine implementation library preserved');
$profile=(string)file_get_contents($root.'/System/Profile/FieldHomeServicesProfile.php');preg_match_all("/'([^']+)'/",$profile,$m);$check(str_contains($profile,'field_home_services'),'Field/Home Services product profile preserved');
echo"\n".($n-$fail)."/{$n} inventory checks passed\n";exit($fail?1:0);
