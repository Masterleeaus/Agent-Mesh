<?php

declare(strict_types=1);
$root=dirname(__DIR__);$manager=(string)file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');$config=(string)file_get_contents($root.'/config/titan-interface-runtime.php');
if(!preg_match("/'plan_pass' => ([0-9]+)/",$manager,$m)||(int)$m[1]<12){fwrite(STDERR,"FAIL manager pass regressed below 12\n");exit(1);}
foreach(["'collection_view_switching'","'same_authority_only' => true","'query_state_preserved' => true","'authoritative_refetch_on_reprojection' => false"] as$n){if(!str_contains($manager,$n)){fwrite(STDERR,"FAIL manager {$n}\n");exit(1);}}
if(!str_contains($manager,"'map_deferred_to_pass' => 13")&&!str_contains($manager,"'map_projection' => 'spatial-workspace'")){fwrite(STDERR,"FAIL manager map handoff contract missing\n");exit(1);}
foreach(["'collection_views'","'cards', 'table', 'board', 'calendar', 'timeline', 'feed'","'persist_preference' => true","'same_authority_only' => true"] as$n){if(!str_contains($config,$n)){fwrite(STDERR,"FAIL config {$n}\n");exit(1);}}
if(!str_contains($config,"'map_deferred_to_pass' => 13")&&!str_contains($config,"'map_projection' => 'spatial-workspace'")){fwrite(STDERR,"FAIL config map handoff contract missing\n");exit(1);}
echo "PASS12_HEALTH_OK\n";
