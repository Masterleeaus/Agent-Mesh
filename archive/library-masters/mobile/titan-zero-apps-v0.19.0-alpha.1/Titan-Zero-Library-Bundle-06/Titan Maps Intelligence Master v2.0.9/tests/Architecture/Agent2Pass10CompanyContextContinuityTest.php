<?php
declare(strict_types=1);
$root=dirname(__DIR__,2);$fail=[];
$assert=function(bool $ok,string $m)use(&$fail){if(!$ok)$fail[]=$m;};
$manifest=json_decode((string)@file_get_contents($root.'/resources/titan-apps/interface-contributions.json'),true);
foreach((array)($manifest['contributions']??[]) as $c){
    $assert(($c['company_scope_key']??null)==='company_id','interface contribution must declare company_id boundary: '.($c['contribution_id']??'?'));
}
$provider=basename($root);
if(str_starts_with($provider,'Titan-CRM-')){
    $event=(string)file_get_contents($root.'/System/Automation/Events/CrmAutomationTriggered.php');
    $listener=(string)file_get_contents($root.'/System/Automation/Listeners/RunCrmAutomationTrigger.php');
    $assert(str_contains($event,'public readonly int $companyId'),'CRM automation event must serialize company_id');
    $assert(str_contains($listener,'$event->companyId'),'CRM automation listener must consume serialized company_id');
    $assert(str_contains($listener,'runWith'),'CRM automation listener must re-establish trusted company scope');
}
if(str_starts_with($provider,'Titan-Time-Attendance-')){
    $job=(string)file_get_contents($root.'/System/Jobs/DetectTimeAttentionJob.php');
    $assert(str_contains($job,"if(\$companyId<=0)"),'time attention job must reject invalid company_id before queue execution');
}
if($fail){fwrite(STDERR,implode("\n",$fail)."\n");exit(1);}fwrite(STDOUT,"Agent2 Pass10 company-context continuity PASS\n");
