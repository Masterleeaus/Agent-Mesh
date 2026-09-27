<?php

declare(strict_types=1);
$root=dirname(__DIR__);
$manifest=json_decode((string)file_get_contents($root.'/extension.manifest.json'),true,512,JSON_THROW_ON_ERROR);
if(version_compare((string)($manifest['version']??'0.0.0'),'0.15.0','<')){fwrite(STDERR,"FAIL manifest version regressed below Pass 15\n");exit(1);}
if(!in_array('trust-governance-receipts',$manifest['health']['dependency_checks']??[],true)){fwrite(STDERR,"FAIL trust/governance health dependency missing\n");exit(1);}
$config=(string)file_get_contents($root.'/config/titan-interface-runtime.php');
foreach(["'governance_calculated_locally' => false","'auto_execute' => false","'actions_are_handoffs_only' => true","'direct_governance_writes' => false"] as$needle){if(!str_contains($config,$needle)){fwrite(STDERR,"FAIL config missing {$needle}\n");exit(1);}}
$governanceFiles=glob($root.'/System/Governance/*.php')?:[];
$forbidden=[
    'Illuminate'.'\\Support\\Facades\\DB',
    'D'.'B::table(',
    '->'.'insert(',
    '->'.'update(',
    '->'.'delete(',
];
foreach($governanceFiles as $f){$s=(string)file_get_contents($f);foreach($forbidden as $needle){if(str_contains($s,$needle)){fwrite(STDERR,'FAIL governance runtime contains direct persistence primitive in '.basename($f)."\n");exit(1);}}}
echo "PASS15_HEALTH_OK\n";
