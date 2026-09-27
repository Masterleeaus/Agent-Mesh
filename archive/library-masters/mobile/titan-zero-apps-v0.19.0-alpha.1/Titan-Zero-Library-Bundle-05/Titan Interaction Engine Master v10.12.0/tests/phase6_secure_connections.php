<?php
declare(strict_types=1);
$root=dirname(__DIR__);spl_autoload_register(static function(string$class)use($root):void{$p='App\\Extensions\\InteractionEngine\\System\\';if(str_starts_with($class,$p)){$f=$root.'/System/'.str_replace('\\','/',substr($class,strlen($p))).'.php';if(is_file($f))require_once$f;}});
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlanCompiler;
$fail=0;$n=0;$check=function(bool$c,string$m)use(&$fail,&$n){$n++;echo($c?'PASS ':'FAIL ').$m."\n";if(!$c)$fail++;};
$keys=['company.name','email.connect.connection_status','sms.connect.connection_status','ai.credentials.connection_status','maps.credentials.connection_status','storage.credentials.connection_status','activation.go_live'];
$compiler=new OnboardingPlanCompiler($keys);$plan=$compiler->compile('c1',['company.name'=>'Apex Plumbing','email.connect.connection_status'=>['status'=>'connected','connection_reference'=>'conn_opaque_1','password'=>'smtp-password'],'sms.connect.connection_status'=>['status'=>'pending','token'=>'sms-token'],'ai.credentials.connection_status'=>['status'=>'connected','api_key'=>'sk-secret'],'maps.credentials.connection_status'=>['status'=>'connected','secret'=>'maps-secret'],'storage.credentials.connection_status'=>['status'=>'connected','credential'=>'storage-secret'],'activation.go_live'=>'draft','email.connect.password'=>'undeclared-secret'],'secure-plan',['correlation_id'=>'corr']);$json=json_encode($plan->toArray(),JSON_UNESCAPED_SLASHES);
foreach(['smtp-password','sms-token','sk-secret','maps-secret','storage-secret','undeclared-secret'] as$secret)$check(!str_contains((string)$json,$secret),"raw secret {$secret} is excluded from onboarding plan");
$check(str_contains((string)$json,'conn_opaque_1'),'opaque connection reference is retained');$check(str_contains((string)$json,'connected'),'safe connection status is retained');
$check(!preg_match('/\"(?:password|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|credential)\"\s*:/i',(string)$json),'plan output contains no secret-bearing nested fields');

$validator=new App\Extensions\InteractionEngine\System\Wizard\Validation\WizardValidationEngine();
$secureStep=['fields'=>[['id'=>'email.connect.connection_status','ui_type'=>'secure_connection','type'=>'text','required'=>true]]];
$check($validator->validateStep($secureStep,['email.connect.connection_status'=>['status'=>'connected','connection_reference'=>'conn_safe']],[])===[],'secure connection validator accepts status plus opaque reference');
$unsafeErrors=$validator->validateStep($secureStep,['email.connect.connection_status'=>['status'=>'connected','connection_reference'=>'conn_safe','password'=>'leak']],[]);
$check(isset($unsafeErrors['email.connect.connection_status']),'secure connection validator rejects secret-bearing structured value');

$catalog=(string)file_get_contents($root.'/resources/wizards/field_home_services_onboarding.json');$check(!preg_match('/"value"\s*:\s*"(?:sk-|password|secret)/i',$catalog),'wizard definition does not embed provider credentials');
echo"\n".($n-$fail)."/{$n} secure-connection checks passed\n";exit($fail?1:0);
