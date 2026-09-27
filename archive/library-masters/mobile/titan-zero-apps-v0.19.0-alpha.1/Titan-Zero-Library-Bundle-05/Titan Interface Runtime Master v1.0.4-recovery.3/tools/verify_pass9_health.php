<?php

declare(strict_types=1);
$root=dirname(__DIR__);$manager=(string)file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');$config=(string)file_get_contents($root.'/config/titan-interface-runtime.php');
if(!preg_match("/'version' => '([0-9]+\.[0-9]+\.[0-9]+)'/",$manager,$v)||version_compare($v[1],'0.9.0','<')){fwrite(STDERR,"FAIL manager version regressed below Pass 9\n");exit(1);}
if(!preg_match("/'plan_pass' => ([0-9]+)/",$manager,$m)||(int)$m[1]<9){fwrite(STDERR,"FAIL manager pass regressed below 9\n");exit(1);}
foreach(["'interaction_engine_adapter'",'InteractionEngineGatewayContract',"'copies_workflow_logic' => false","'copies_session_data' => false","'direct_execution' => false"] as$n){if(!str_contains($manager,$n)){fwrite(STDERR,"FAIL manager {$n}\n");exit(1);}}
foreach(["'interaction_engine'","'copy_workflow_logic' => false","'copy_session_data' => false","'direct_execution' => false","'go' => 'field'","'hub' => 'customer'"] as$n){if(!str_contains($config,$n)){fwrite(STDERR,"FAIL config {$n}\n");exit(1);}}
echo "PASS9_HEALTH_OK\n";
