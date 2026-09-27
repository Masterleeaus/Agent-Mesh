<?php
declare(strict_types=1);
$root=dirname(__DIR__);spl_autoload_register(function($class)use($root){$prefix='App\\Extensions\\InteractionEngine\\';if(str_starts_with($class,$prefix)){$rel=str_replace('\\','/',substr($class,strlen($prefix)));$f=$root.'/'.$rel.'.php';if(is_file($f))require_once$f;}});
$fail=[];$check=function($c,$m)use(&$fail){echo($c?'PASS ':'FAIL ').$m."\n";if(!$c)$fail[]=$m;};
$p=new App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy();
$check($p->canonicalSurfaces()===['zero','go','hub'],'only zero/go/hub are canonical');
foreach(['bos','command','owner','manager','business','onboarding','setup'] as $a)$check($p->canonicalSurface($a)==='zero',"$a aliases to zero");
$check($p->canonicalSurface('field')==='go','field aliases to go');$check($p->canonicalSurface('customer')==='hub','customer aliases to hub');
$check($p->allows('zero','field_home_services_onboarding_v1','onboarding'),'onboarding wizard is allowed on Zero journey');
$check(!$p->allows('go','field_home_services_onboarding_v1','onboarding'),'onboarding journey fails closed outside Zero');
$c=new App\Extensions\InteractionEngine\System\Contracts\InteractionContext('c1','u1','go',deviceId:'d1');$planner=new App\Extensions\InteractionEngine\System\Presentation\DeterministicPresentationIntentPlanner(new App\Extensions\InteractionEngine\System\Presentation\PresentationIntentGuard());$i=$planner->plan($c,'field.today',['actions'=>[['intent'=>'titan.field.work_order.open']]]);$check($i->surface==='go'&&$i->actions[0]['intent']==='titan.field.work_order.open','presentation intent preserves governed action intent');
try{new App\Extensions\InteractionEngine\System\Contracts\PresentationIntent('go','bad',actions:[['url'=>'/delete']]);$check(false,'raw action rejected');}catch(InvalidArgumentException){$check(true,'raw action rejected');}
$m=json_decode(file_get_contents($root.'/extension.manifest.json'),true);$check(($m['titan_apps']['canonical_component']??'')==='interaction-engine','manifest declares Titan Apps ownership');$check(in_array('interaction.surface.zero',$m['capabilities']??[],true),'manifest advertises Zero surface');$check(!in_array('interaction.surface.command',$m['capabilities']??[],true),'command surface no longer canonical capability');
exit($fail?1:0);
