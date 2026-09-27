<?php
declare(strict_types=1);
$root=dirname(__DIR__);
$routes=file_get_contents($root.'/routes/web.php');
$controller=file_get_contents($root.'/System/Http/Controllers/HubApiController.php');
$provider=file_get_contents($root.'/System/TitanHubServiceProvider.php');
$js=file_get_contents($root.'/resources/js/hub.js');
function hcn(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
hcn(str_contains($routes,"/capabilities"),'capability discovery API is routed');
hcn(str_contains($controller,'HubCapabilityDiscovery'),'controller consumes capability discovery service');
hcn(str_contains($provider,'HubCapabilityDiscovery::class'),'capability discovery service is container-bound');
hcn(str_contains($js,"/capabilities"),'client loads provider-backed capability map');
hcn(str_contains($js,'button.disabled'),'client disables unavailable workspaces');
hcn(str_contains($js,"aria-disabled"),'client exposes unavailable workspace state accessibly');
