<?php
$root=dirname(__DIR__);
$m=json_decode(file_get_contents($root.'/extension.json'),true,512,JSON_THROW_ON_ERROR);
if(($m['version']??null)!=='1.0.4-recovery.3'){fwrite(STDERR,"FAIL recovery version\n");exit(1);}
if(($m['data_boundary']['canonical_company_key']??null)!=='company_id'){fwrite(STDERR,"FAIL company boundary\n");exit(1);}
$p=file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
foreach(['InstalledBuilderCatalogue','InstalledVisualRuntimeBridge','InteractionEngineActionIntentDispatcher','TitanInterfaceRuntimeManagerContract'] as $needle){
 if(!str_contains($p,$needle)){fwrite(STDERR,"FAIL provider lost $needle\n");exit(1);}
}
foreach([
 'System/Contracts/Decision/DecisionWorkspaceContract.php',
 'System/Contracts/Governance/GovernanceWorkspaceContract.php',
 'System/Contracts/WorkingSet/WorkingSetWorkspaceContract.php',
 'System/Contracts/Presentation/PresentationComposerContract.php',
 'System/Contracts/Authority/GovernedActionDispatcherContract.php',
] as $rel){
 if(!is_file($root.'/'.$rel)){fwrite(STDERR,"FAIL recovered body missing $rel\n");exit(1);}
}
echo "EIGHT_SUITE_RECOVERY_REBASE: PASS\n";
