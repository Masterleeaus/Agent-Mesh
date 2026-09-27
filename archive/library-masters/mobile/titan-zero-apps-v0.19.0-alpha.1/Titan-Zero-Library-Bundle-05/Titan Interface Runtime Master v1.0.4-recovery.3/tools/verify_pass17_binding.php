<?php

declare(strict_types=1);
$root=dirname(__DIR__);
$provider=file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
$routes=file_get_contents($root.'/routes/user.php');
if(!str_contains($provider,'ConfigurationLifecycleWorkspaceContract::class'))throw new RuntimeException('Pass 17 workspace contract is not registered.');
if(!str_contains($provider,'new ConfigurationLifecycleWorkspaceComposer'))throw new RuntimeException('Pass 17 workspace composer is not registered.');
if(!str_contains($routes,"/configuration/{objectReference}"))throw new RuntimeException('Pass 17 configuration lifecycle route is missing.');
echo "PASS 17 BINDING: configuration lifecycle workspace is bound and routed\n";
