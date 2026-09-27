<?php
$root=dirname(__DIR__);
$p=file_get_contents($root.'/System/Presentation/AdaptiveHubPresentationBridge.php');
foreach(['PublicInteractionEngineInterface','CapabilityIntentGatewayInterface','InteractionContext'] as $needle){
 if(!str_contains($p,$needle)){fwrite(STDERR,"FAIL Hub live interaction wiring missing $needle\n");exit(1);}
}
if(str_contains($p,'TitanInteractionEngine\\System\\InteractionEngineManager')){fwrite(STDERR,"FAIL stale Interaction Engine namespace remains\n");exit(1);}
echo "HUB_EIGHT_SUITE_INTERACTION_WIRING: PASS\n";
