<?php
$root=dirname(__DIR__,2);
$provider=file_get_contents($root.'/System/InteractionEngineServiceProvider.php');
$required=[
 'titan.apps.interaction.capability-registry',
 'titan.apps.interaction.journey-registry',
 'titan.apps.interaction.wizard-registry',
 'titan.apps.interaction.wizard-engine',
 'titan.apps.interaction.session-store',
 'titan.apps.interface.renderer',
 'titan.apps.interaction.command-mapper',
 'titan.platform.approval-service',
 'titan.apps.surface-resolver',
];
$fail=0;$pass=0;
foreach($required as $alias){$ok=str_contains($provider,"'{$alias}'"); echo ($ok?'PASS':'FAIL')." alias {$alias}\n"; $ok?$pass++:$fail++;}
foreach(['ProviderCapabilityRegistryGateway.php','ProviderJourneyRegistryGateway.php'] as $file){
 $found=is_file($root.'/System/PublicApi/'.$file); echo ($found?'PASS':'FAIL')." public api {$file}\n"; $found?$pass++:$fail++;
}
echo "RESULT pass={$pass} fail={$fail}\n"; exit($fail?1:0);
