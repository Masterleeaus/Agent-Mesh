<?php

declare(strict_types=1);
$root=dirname(__DIR__);
$provider=(string)file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
$routes=(string)file_get_contents($root.'/routes/user.php');
$manager=(string)file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');
preg_match("/'version'\\s*=>\\s*'([^']+)'/",$manager,$vm);$version=$vm[1]??'0.0.0';
preg_match("/'plan_pass'\\s*=>\\s*(\\d+)/",$manager,$pm);$pass=(int)($pm[1]??0);
$checks=[
    'gateway contract binding'=>str_contains($provider,'GovernanceStateGatewayContract::class'),
    'workspace contract binding'=>str_contains($provider,'GovernanceWorkspaceContract::class'),
    'receipt presenter binding'=>str_contains($provider,'ReceiptPresenterContract::class'),
    'TitanAI soft provider fallback'=>str_contains($provider,"'titan.interface.governance'"),
    'governance route'=>str_contains($routes,"/governance/{objectReference}/{actionKey}"),
    'health diagnostics'=>str_contains($manager,"'trust_governance_receipts'"),
    'version'=>version_compare($version,'0.15.0','>='),
    'pass'=>$pass>=15,
];
$failed=[];foreach($checks as$name=>$ok)if(!$ok)$failed[]=$name;
if($failed!==[]){fwrite(STDERR,'FAIL PASS 15 BINDING: '.implode(', ',$failed)."\n");exit(1);}echo "PASS 15 BINDING VERIFY: governance gateway/workspace/receipt bindings, route and health diagnostics are present\n";
