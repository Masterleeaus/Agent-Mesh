<?php
$root=realpath(__DIR__.'/..');
foreach([
 'System/Contracts/GovernedOperationLedgerInterface.php',
 'System/Contracts/GovernedOperationActivityGatewayInterface.php',
 'System/Operations/InMemoryGovernedOperationLedger.php',
 'System/Operations/GovernedOperationActivityGateway.php',
] as $rel) assert(is_file($root.'/'.$rel));
$gateway=file_get_contents($root.'/System/CapabilityIntentGateway.php');
assert(str_contains($gateway,'GovernedOperationLedgerInterface'));
assert(str_contains($gateway,'record('));
$provider=file_get_contents($root.'/System/InteractionEngineServiceProvider.php');
assert(str_contains($provider,'GovernedOperationLedgerInterface::class'));
assert(str_contains($provider,'GovernedOperationActivityGatewayInterface::class'));
echo "governed_operation_activity_contract: ok\n";
