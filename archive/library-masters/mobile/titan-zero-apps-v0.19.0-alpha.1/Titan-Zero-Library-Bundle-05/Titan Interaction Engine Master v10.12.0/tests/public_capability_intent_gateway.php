<?php
$root=dirname(__DIR__);
$m=json_decode(file_get_contents($root.'/extension.json'),true,512,JSON_THROW_ON_ERROR);
$c='App\\Extensions\\InteractionEngine\\System\\Contracts\\CapabilityIntentGatewayInterface';
if(!in_array($c,$m['public_contracts']??[],true)){fwrite(STDERR,"FAIL public contract missing\n");exit(1);}
$p=file_get_contents($root.'/System/CapabilityIntentGateway.php');
foreach(['company_id','interaction-engine-governed','CapabilityExecutionContext'] as $needle){
 if(!str_contains($p,$needle)){fwrite(STDERR,"FAIL gateway missing $needle\n");exit(1);}
}
echo "PUBLIC_CAPABILITY_INTENT_GATEWAY: PASS\n";
