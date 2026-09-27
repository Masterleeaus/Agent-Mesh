<?php

declare(strict_types=1);
$root=dirname(__DIR__);
$provider=(string)file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
$routes=(string)file_get_contents($root.'/routes/user.php');
$manager=(string)file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');
$config=(string)file_get_contents($root.'/config/titan-interface-runtime.php');
foreach(['WorkingSetGatewayContract','TitanWorkspaceProjectGateway','WorkingSetDomainItemVerifierContract','HostTitanAssistWorkingSetItemVerifier','WorkingSetWorkspaceContract','WorkingSetWorkspaceComposer'] as$needle){if(!str_contains($provider,$needle)){fwrite(STDERR,"FAIL provider missing {$needle}\n");exit(1);}}
foreach(['WorkingSetWorkspaceController','working-set.show'] as$needle){if(!str_contains($routes,$needle)){fwrite(STDERR,"FAIL route missing {$needle}\n");exit(1);}}
foreach(['working_sets_workspace_context','membership_grants_authorization','membership_removal_deletes_source_data'] as$needle){if(!str_contains($manager,$needle)){fwrite(STDERR,"FAIL health missing {$needle}\n");exit(1);}}
foreach(["'membership_grants_authorization' => false","'membership_removal_deletes_source_data' => false","'shared_context_for_people_and_ai' => true"]as$needle){if(!str_contains($config,$needle)){fwrite(STDERR,"FAIL config missing {$needle}\n");exit(1);}}
if(substr_count($provider,'$this->registerRoutes();')!==1){fwrite(STDERR,"FAIL route registration must remain exactly once\n");exit(1);}
echo "PASS16_BINDING_OK\n";
