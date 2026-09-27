<?php
declare(strict_types=1);
$root=dirname(__DIR__);
spl_autoload_register(function(string $class)use($root){$p='App\\Extensions\\InteractionEngine\\';if(str_starts_with($class,$p)){$f=$root.'/'.str_replace('\\','/',substr($class,strlen($p))).'.php';if(is_file($f))require_once$f;}});
use App\Extensions\InteractionEngine\System\Presentation\PresentationIntentGuard;
$guard=new PresentationIntentGuard();$failed=[];$pass=function(bool $ok,string $m)use(&$failed){echo($ok?'PASS ':'FAIL ').$m."\n";if(!$ok)$failed[]=$m;};
$guard->validate(['crm.customer.summary'],['crm.customer.zero'],['motionPreset'=>'subtle'],[['intent'=>'crm.customer.read']]);$pass(true,'valid governed metadata accepted');
$cases=[
 [['rawHtml'=>'<b>x</b>'], 'camelCase rawHtml key rejected'],
 [['access-token'=>'x'], 'formatted access token key rejected'],
 [['href'=>'javascript:alert(1)'], 'javascript URI value rejected'],
 [['content'=>'<iframe src="https://evil.test"></iframe>'], 'executable markup value rejected'],
 [['nested'=>['provider_credentials'=>['token'=>'x']]], 'nested provider credentials rejected'],
];
foreach($cases as [$visual,$label]){try{$guard->validate(['crm.customer.summary'],[], $visual,[]);$pass(false,$label);}catch(InvalidArgumentException){$pass(true,$label);}}
$deep=[];$cursor=&$deep;for($i=0;$i<26;$i++){$cursor['x']=[];$cursor=&$cursor['x'];}
try{$guard->validate(['crm.customer.summary'],[],$deep,[]);$pass(false,'excessive nesting rejected');}catch(InvalidArgumentException){$pass(true,'excessive nesting rejected');}
exit($failed?1:0);
