<?php

declare(strict_types=1);
$root=dirname(__DIR__);$m=file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');$c=file_get_contents($root.'/config/titan-interface-runtime.php');
foreach(["'configuration_lifecycle_workspace'","'actions_are_handoffs_only' => true","'direct_configuration_writes' => false"] as $needle)if(!str_contains($m,$needle))throw new RuntimeException("Health metadata missing {$needle}");
if(!preg_match("/'plan_pass'\\s*=>\\s*(\\d+)/",$m,$match)||((int)$match[1])<17)throw new RuntimeException('Cumulative plan pass regressed below Pass 17.');
if(!str_contains($c,"'configuration_lifecycle'"))throw new RuntimeException('Pass 17 config block missing.');
echo "PASS 17 HEALTH: lifecycle health and source-authority boundaries remain declared in the cumulative runtime\n";
