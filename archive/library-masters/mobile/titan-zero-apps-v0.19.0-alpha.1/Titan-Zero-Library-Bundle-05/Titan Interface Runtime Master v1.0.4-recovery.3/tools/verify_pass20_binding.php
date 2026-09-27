<?php

declare(strict_types=1);
$root=dirname(__DIR__);
function b20(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
$provider=file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
$routes=file_get_contents($root.'/routes/user.php');
$manager=file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');
$config=file_get_contents($root.'/config/titan-interface-runtime.php');
b20(str_contains($provider,'FocusWorkspacePolicyContract::class'),'Focus workspace policy is not bound.');
b20(str_contains($provider,'AttentionHudProjectorContract::class'),'Attention HUD projector is not bound.');
b20(str_contains($provider,'GuidanceOverlayProjectorContract::class'),'Guidance overlay projector is not bound.');
b20(str_contains($routes,"name('experience.shell')"),'Experience shell route is missing.');
b20(str_contains($manager,"'donor_rationalization_e2e_release'"),'Runtime health does not expose Pass 20 final state.');
b20(str_contains($config,"'preserve_global_safety_controls' => true"),'Focus safety policy is not configured.');
echo "PASS 20 BINDING: focus/HUD/guidance experience primitives, route, config and health are wired\n";
