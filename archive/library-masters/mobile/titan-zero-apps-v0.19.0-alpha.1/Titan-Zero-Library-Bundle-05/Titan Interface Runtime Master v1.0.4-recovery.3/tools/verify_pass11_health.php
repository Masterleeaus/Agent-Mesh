<?php

declare(strict_types=1);
$root=dirname(__DIR__);$manager=(string)file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');$config=(string)file_get_contents($root.'/config/titan-interface-runtime.php');
if(!preg_match("/'plan_pass' => ([0-9]+)/",$manager,$m)||(int)$m[1]<11){fwrite(STDERR,"FAIL manager pass regressed below 11\n");exit(1);}
foreach(["'action_registry'","'context_inspector_command_surface'","'object_payload_loading' => false","'context_preserved' => true","'direct_execution' => false"] as$n){if(!str_contains($manager,$n)){fwrite(STDERR,"FAIL manager {$n}\n");exit(1);}}
foreach(["'command'","'default_limit' => 30","'max_limit' => 100","'registry-and-current-context'","'inspector'","'full_workspace_optional' => true","'direct_execution' => false"] as$n){if(!str_contains($config,$n)){fwrite(STDERR,"FAIL config {$n}\n");exit(1);}}
echo "PASS11_HEALTH_OK\n";
