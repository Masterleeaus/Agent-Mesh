<?php

declare(strict_types=1);
$root=dirname(__DIR__);
$manifest=json_decode((string)file_get_contents($root.'/extension.manifest.json'),true,512,JSON_THROW_ON_ERROR);
if(version_compare((string)($manifest['version']??'0.0.0'),'0.14.0','<')){fwrite(STDERR,"FAIL manifest version regressed below Pass 14\n");exit(1);}
if(!in_array('decide-scenario-workspace',$manifest['health']['dependency_checks']??[],true)){fwrite(STDERR,"FAIL decision health dependency missing\n");exit(1);}
$config=(string)file_get_contents($root.'/config/titan-interface-runtime.php');
foreach(["'recommendation_is_not_execution' => true","'auto_execute' => false","'actions_are_intents_only' => true"] as $needle){if(!str_contains($config,$needle)){fwrite(STDERR,"FAIL config missing {$needle}\n");exit(1);}}
echo "PASS14_HEALTH_OK\n";
