<?php
$root=realpath(__DIR__.'/../..');
require_once $root.'/System/Services/AppOperatingTimelinePolicy.php';
use App\Extensions\TitanAppsCore\System\Services\AppOperatingTimelinePolicy;

$p=new AppOperatingTimelinePolicy();
$rows=$p->merge([
 ['id'=>'a','kind'=>'job','occurred_at'=>'2026-08-31T09:00:00+10:00','state'=>'scheduled','title'=>'Job A'],
 ['id'=>'b','kind'=>'operation','occurred_at'=>'2026-08-31T08:30:00+10:00','state'=>'active','title'=>'Op B'],
 ['id'=>'c','kind'=>'approval','occurred_at'=>null,'state'=>'attention','title'=>'Approval C'],
]);
assert(count($rows)===3);
assert($rows[0]['id']==='b');
assert($rows[1]['id']==='a');
assert($rows[2]['id']==='c');
assert($rows[0]['execution_authority']===false);
echo "core_operating_timeline_contract: ok\n";
