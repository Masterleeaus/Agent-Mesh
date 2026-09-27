<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix='App\\Extensions\\TitanInterfaceRuntime\\'; if(!str_starts_with($class,$prefix))return;
    $path=$root.'/'.str_replace('\\','/',substr($class,strlen($prefix))).'.php'; if(is_file($path))require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\ProductSurface\ProductSurfacePolicy;

function expect18(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}

$policy = new ProductSurfacePolicy();
$command = $policy->profile(new InterfaceContext(7,11,'command','crm',roles:['owner'],capabilities:['*']));
$go = $policy->profile(new InterfaceContext(7,22,'go','work',roles:['worker'],capabilities:['jobs.work.execute']));
$hub = $policy->profile(new InterfaceContext(7,33,'hub','crm',roles:['customer'],capabilities:['crm.customer.view']));
$onboarding = $policy->profile(new InterfaceContext(7,44,'onboarding','setup',roles:['manager'],capabilities:['setup.view']));
expect18($command->audience==='owner-manager' && $command->advancedControls,'Command profile must remain owner/manager capable.');
expect18($go->density==='compact' && $go->mobileFirst,'Go must use compact mobile-first policy.');
expect18($hub->customerSafeRequired && !$hub->advancedControls,'Hub must hard-require customer-safe simple presentation.');
expect18($onboarding->progressiveDisclosure && $onboarding->navigationMode==='stepwise','Onboarding must use progressive stepwise disclosure.');
echo "PASS 18 VERIFY: Command/Go/Hub/Onboarding product-surface policy profiles are explicit and bounded\n";
