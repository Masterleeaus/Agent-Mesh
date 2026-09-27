<?php

declare(strict_types=1);
$root=dirname(__DIR__,2);
spl_autoload_register(static function(string$class)use($root):void{$p='App\\Extensions\\InteractionEngine\\System\\';if(str_starts_with($class,$p)){$f=$root.'/System/'.str_replace('\\','/',substr($class,strlen($p))).'.php';if(is_file($f))require_once$f;}});
use App\Extensions\InteractionEngine\System\Presentation\GeneratedUiPresenter;
use App\Extensions\InteractionEngine\System\Wizard\{WizardDefinition,WizardSession};
$fail=static function(string$m):never{fwrite(STDERR,"FAIL: {$m}\n");exit(1);};
$def=new WizardDefinition('secure_ui_v1','1.0.0','Secure UI','crm.quote.create', [['id'=>'a','fields'=>[['id'=>'a','type'=>'text']]]], ['owner'], ['surfaces'=>['zero']], ['mode'=>'offline_queueable']);
$session=new WizardSession(id:'s1',definition:$def,context:['company_id'=>'42','source_surface'=>'command','tenant_id'=>'42']);
$out=(new GeneratedUiPresenter())->present($session);
if (($out['company_id']??null)!=='42') $fail('generated UI missing canonical company_id');
if (($out['surface']??null)!=='zero') $fail('generated UI surface is not canonical');
if (isset($out['tenant_id'])||isset($out['tenant_company_id'])) $fail('generated UI leaked legacy tenant identifier');
$bad=new WizardSession(id:'s2',definition:$def,context:['company_id'=>'42','source_surface'=>'zero','tenant_company_id'=>'99']);
$thrown=false;try{(new GeneratedUiPresenter())->present($bad);}catch(InvalidArgumentException){$thrown=true;}
if(!$thrown)$fail('generated UI did not fail closed on legacy tenant conflict');
echo "PASS: generated UI company + projection security\n";
