<?php

declare(strict_types=1);
$root=dirname(__DIR__);
function p19b(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
$provider=file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
$routes=file_get_contents($root.'/routes/user.php');
$manager=file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');
$config=file_get_contents($root.'/config/titan-interface-runtime.php');
$manifest=json_decode(file_get_contents($root.'/resources/interface/interface-manifest.json'),true,512,JSON_THROW_ON_ERROR);
p19b(str_contains($provider,'OfflineSyncWorkspaceContract::class'),'Offline/sync workspace is not bound.');
p19b(str_contains($provider,'PresentationQualityGate::class'),'Presentation quality gate is not bound.');
p19b(str_contains($provider,'interaction-engine-sync'),'Interaction Engine sync adapter binding is missing.');
p19b(str_contains($routes,"name('sync.workspace')"),'Read-only sync workspace route is missing.');
p19b(str_contains($manager,"'offline_sync_accessibility_performance'"),'Runtime health does not expose Pass 19 state.');
p19b(str_contains($config,"'wcag_target' => '2.2-AA'") && str_contains($config,"'p95_presentation_ms'"),'Quality budgets are not configured.');
$sync=array_values(array_filter((array)($manifest['global_work']??[]),static fn($row)=>($row['tray']??null)==='sync'&&($row['provider_ref']??null)==='interaction-engine-sync'));
p19b(count($sync)===1,'Interface manifest must publish exactly one source-authoritative sync provider adapter.');
echo "PASS 19 BINDING: sync workspace, Interaction Engine status adapter, quality gate, route, config and health are wired\n";
