<?php
declare(strict_types=1);
$root=dirname(__DIR__);spl_autoload_register(static function(string$class)use($root):void{$p='App\\Extensions\\InteractionEngine\\System\\';if(str_starts_with($class,$p)){$f=$root.'/System/'.str_replace('\\','/',substr($class,strlen($p))).'.php';if(is_file($f))require_once$f;}});
use App\Extensions\InteractionEngine\System\Presentation\GeneratedUiPresenter;
use App\Extensions\InteractionEngine\System\Wizard\{WizardDefinition,WizardSession};
$fail=0;$n=0;$check=function(bool$c,string$m)use(&$fail,&$n){$n++;echo($c?'PASS ':'FAIL ').$m."\n";if(!$c)$fail++;};
$def=new WizardDefinition('ui_test_v1','1.0.0','UI Test','crm.appointment.create', [
    ['id'=>'hours','title'=>'Business hours','prompt'=>'When are you open?','fields'=>[
        ['id'=>'hours','type'=>'weekly_schedule','required'=>true,'help_text'=>'Use local business time.'],
    ]],
], ['customer'], ['surfaces'=>['hub']], ['mode'=>'offline_queueable']);
$session=new WizardSession(id:'s-ui',definition:$def,context:['company_id'=>'c1','user_id'=>'u1','source_surface'=>'hub']);$ui=(new GeneratedUiPresenter())->present($session);
foreach(['interaction_id','wizard_id','session_id','step_id','title','prompt','description','input_type','options','validation','ui_hint','help_text','progress','actions','requires_online','authority_state'] as$key)$check(array_key_exists($key,$ui),"generated UI includes {$key}");
$check($ui['wizard_id']==='ui_test_v1'&&$ui['session_id']==='s-ui','generated UI binds to the same wizard session');
$check($ui['ui_hint']==='weekly_schedule','generated UI derives weekly schedule rendering hint');
$check($ui['requires_online']===false&&$ui['offline_mode']==='offline_queueable','generated UI exposes server-owned offline classification');
$hybrid=(string)file_get_contents($root.'/System/Wizard/Renderer/HybridRenderer.php');$check(str_contains($hybrid,"'interaction'"),'hybrid renderer embeds canonical generated interaction envelope');
echo"\n".($n-$fail)."/{$n} generated-UI checks passed\n";exit($fail?1:0);
