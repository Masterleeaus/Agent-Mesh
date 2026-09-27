<?php
declare(strict_types=1);
$root=dirname(__DIR__);
spl_autoload_register(static function(string$class)use($root):void{$p='App\\Extensions\\InteractionEngine\\System\\';if(str_starts_with($class,$p)){$f=$root.'/System/'.str_replace('\\','/',substr($class,strlen($p))).'.php';if(is_file($f))require_once$f;}});
$fail=0;$check=function(bool$c,string$m)use(&$fail){echo($c?'PASS ':'FAIL ').$m."\n";if(!$c)$fail++;};
$class='App\\Extensions\\InteractionEngine\\System\\Profile\\FieldHomeServicesVerticalPackRegistry';
$check(class_exists($class),'vertical pack registry exists');
if(class_exists($class)){$r=new $class($root.'/resources/verticals/field-home-services');$all=$r->all();$check(count($all)===10,'exactly ten canonical vertical packs load');foreach(App\Extensions\InteractionEngine\System\Profile\FieldHomeServicesProfile::VERTICALS as$slug){$check(isset($all[$slug]),"vertical pack {$slug} exists");$check(($all[$slug]['wizard_overrides']['engine_logic']??null)==='unchanged',"{$slug} pack does not replace engine logic");}}
$data=json_decode((string)file_get_contents($root.'/resources/wizards/field_home_services_onboarding.json'),true,512,JSON_THROW_ON_ERROR);$verticalField=null;$destCount=0;foreach($data['wizard']['steps'] as$step)foreach($step['fields'] as$f){if(($f['id']??'')==='business.verticals')$verticalField=$f;if(isset($f['destination_provider'],$f['capability']))$destCount++;}
$check(($verticalField['allowed_values']??[])===App\Extensions\InteractionEngine\System\Profile\FieldHomeServicesProfile::VERTICALS,'onboarding uses canonical ten vertical slugs');$check($destCount===116,'all 116 onboarding questions carry destination metadata');
exit($fail?1:0);
