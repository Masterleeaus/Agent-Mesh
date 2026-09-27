<?php
$root=dirname(__DIR__,2);
$contract=file_get_contents($root.'/System/Contracts/TitanAppsInteractionContract.php');
$gateway=file_get_contents($root.'/System/Runtime/TitanAppsInteractionGateway.php');
if(!str_contains($contract,'function interpret(')){fwrite(STDERR,"public interaction contract missing interpret()\n");exit(1);} 
if(!str_contains($gateway,'function interpret(')){fwrite(STDERR,"gateway missing interpret()\n");exit(1);} 
if(!str_contains($gateway,'execution_authority_granted')){fwrite(STDERR,"interpretation safety invariant missing\n");exit(1);} 
echo "PASS titan apps public interpretation contract\n";
