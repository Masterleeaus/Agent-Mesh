<?php

declare(strict_types=1);
$root=dirname(__DIR__);$manager=(string)file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');$config=(string)file_get_contents($root.'/config/titan-interface-runtime.php');$manifest=(string)file_get_contents($root.'/extension.manifest.json');
if(!preg_match("/'plan_pass' => ([0-9]+)/",$manager,$m)||(int)$m[1]<13){fwrite(STDERR,"FAIL manager pass regressed below 13\n");exit(1);}
foreach(["'spatial_workspace'","'authority' => 'titan-maps-intelligence'","'manifest_opt_in_required' => true","'direct_spatial_calculations' => false","'actions_are_intents_only' => true"] as$n){if(!str_contains($manager,$n)){fwrite(STDERR,"FAIL manager {$n}\n");exit(1);}}
foreach(["'spatial'","'authority' => 'titan-maps-intelligence'","'view_kind' => 'map'","'invalid_geometry_policy' => 'omit-not-recalculate'"] as$n){if(!str_contains($config,$n)){fwrite(STDERR,"FAIL config {$n}\n");exit(1);}}
if(!str_contains($manifest,'"spatial-workspace"')){fwrite(STDERR,"FAIL manifest health dependency missing spatial-workspace\n");exit(1);}
if(str_contains($manager,"'spatial_authority' => true")){fwrite(STDERR,"FAIL Interface Runtime must not claim spatial authority\n");exit(1);}
echo "PASS13_HEALTH_OK\n";
