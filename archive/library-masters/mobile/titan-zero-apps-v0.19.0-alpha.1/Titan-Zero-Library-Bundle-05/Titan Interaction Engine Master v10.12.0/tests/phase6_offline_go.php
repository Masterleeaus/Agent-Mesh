<?php
declare(strict_types=1);
$root=dirname(__DIR__);spl_autoload_register(static function(string$class)use($root):void{$p='App\\Extensions\\InteractionEngine\\System\\';if(str_starts_with($class,$p)){$f=$root.'/System/'.str_replace('\\','/',substr($class,strlen($p))).'.php';if(is_file($f))require_once$f;}});
use App\Extensions\InteractionEngine\System\Capabilities\Providers\{CrmCapabilityProvider,BuilderCapabilityProvider,ConnectCapabilityProvider};
$fail=0;$n=0;$check=function(bool$c,string$m)use(&$fail,&$n){$n++;echo($c?'PASS ':'FAIL ').$m."\n";if(!$c)$fail++;};
$crm=new CrmCapabilityProvider();$builder=new BuilderCapabilityProvider();$connect=new ConnectCapabilityProvider();
$check(($crm->descriptors()['crm.work_order.complete']->offlineMode??'')==='offline_queueable','field job completion is server-classified queueable');
$check(($crm->descriptors()['crm.work_order.update']->offlineMode??'')==='offline_queueable','field work-order update is server-classified queueable');
$check(($builder->descriptors()['builder.publish']->offlineMode??'')==='online_required','Builder publish is online-required');
$check(($connect->descriptors()['communications.connection.start']->offlineMode??'')==='online_required','channel connection start is online-required');
$engine=(string)file_get_contents($root.'/System/Wizard/UniversalWizardEngine.php');$check(str_contains($engine,'$offlineMode === \'offline_queueable\''),'wizard runtime queues only descriptor/definition queueable actions');$check(str_contains($engine,"status = 'awaiting_online'")||str_contains($engine,"status = 'awaiting_online'"),'online-required action preserves wizard state as awaiting_online');
$local=(string)file_get_contents($root.'/System/LocalIntelligence/LocalBrain.php');$check(!preg_match('/return\s+[^;]*(executed|configured|published)/i',$local),'LocalBrain does not fabricate authoritative remote execution');
$brain=App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain::createDefault();$onlineDecision=$brain->process('zxqv uncertain remote request',['company_id'=>'local-test','online'=>true]);$offlineDecision=$brain->process('zxqv uncertain remote request',['company_id'=>'local-test','online'=>false]);
$check(($onlineDecision['escalation']['target']??null)==='titan_ai'&&($onlineDecision['escalation']['status']??null)==='recommended','uncertain LocalBrain result recommends TitanAI escalation only as a boundary decision when online');
$check(($offlineDecision['escalation']['status']??null)==='deferred','uncertain LocalBrain result defers cloud escalation when offline');
$outbox=(string)file_get_contents($root.'/System/Wizard/Offline/DatabaseWizardOutboxStore.php');$check(str_contains($outbox,"where('company_id'"),'wizard outbox replay/storage is company scoped');
echo"\n".($n-$fail)."/{$n} Titan Go offline checks passed\n";exit($fail?1:0);
