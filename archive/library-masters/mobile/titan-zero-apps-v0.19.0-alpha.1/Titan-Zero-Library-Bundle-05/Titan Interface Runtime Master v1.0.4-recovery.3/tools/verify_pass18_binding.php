<?php

declare(strict_types=1);

$root=dirname(__DIR__);
function e18b(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
$provider=file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
$routes=file_get_contents($root.'/routes/user.php');
$manager=file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');
$config=file_get_contents($root.'/config/titan-interface-runtime.php');
e18b(str_contains($provider,'ProductSurfacePolicyContract::class'),'Product surface policy contract is not bound.');
e18b(str_contains($provider,'ProductSurfacePolicyProjectorContract::class'),'Product surface projector contract is not bound.');
e18b(str_contains($routes,"name('surface.policy')"),'Surface policy route is missing.');
e18b(str_contains($manager,"'product_surface_policies'"),'Health does not expose product surface policy state.');
e18b(str_contains($config,"'surface_policies'"),'Product surface policy config is missing.');
echo "PASS 18 BINDING: product surface policy is bound, routable and observable\n";
