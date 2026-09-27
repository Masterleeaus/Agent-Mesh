<?php
$root=realpath(__DIR__.'/../..');
$c=file_get_contents($root.'/config/titan-apps-core.php');
foreach(['System\\Contracts\\InterfaceRuntime','System\\Contracts\\InterfaceContributionRegistry','System\\Contracts\\ActionIntentDispatcher'] as $needle){
 if(!str_contains($c,$needle)){fwrite(STDERR,"FAIL Core missing actual Interface Runtime contract: $needle\n");exit(1);}
}
foreach(['TitanInterfaceRuntimeManagerContract','PresentationComposerContract'] as $stale){
 if(str_contains($c,$stale)){fwrite(STDERR,"FAIL Core stale Interface Runtime contract: $stale\n");exit(1);}
}
echo "CORE_INTERFACE_RUNTIME_LIVE_CONTRACT: PASS\n";
