<?php

declare(strict_types=1);
$root=dirname(__DIR__);$manager=(string)file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');$config=(string)file_get_contents($root.'/config/titan-interface-runtime.php');
if(!preg_match("/'version' => '([0-9]+\.[0-9]+\.[0-9]+)'/",$manager,$v)||version_compare($v[1],'0.10.0','<')){fwrite(STDERR,"FAIL manager version regressed below Pass 10\n");exit(1);}
if(!preg_match("/'plan_pass' => ([0-9]+)/",$manager,$m)||(int)$m[1]<10){fwrite(STDERR,"FAIL manager pass regressed below 10\n");exit(1);}
foreach(["'global_work_registry'","'global_work_trays'","'aggregate_references_only' => true","'direct_execution' => false"] as$n){if(!str_contains($manager,$n)){fwrite(STDERR,"FAIL manager {$n}\n");exit(1);}}
foreach(["'global_work'","'continue'", "'attention'", "'approvals'", "'inbox'", "'sync'", "'tenant_recheck' => true", "'capability_recheck' => true"] as$n){if(!str_contains($config,$n)){fwrite(STDERR,"FAIL config {$n}\n");exit(1);}}
echo "PASS10_HEALTH_OK\n";
