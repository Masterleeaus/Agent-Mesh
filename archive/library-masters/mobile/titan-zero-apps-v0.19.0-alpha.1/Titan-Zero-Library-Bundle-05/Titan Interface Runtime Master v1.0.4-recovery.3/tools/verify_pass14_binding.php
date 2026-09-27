<?php

declare(strict_types=1);
$root=dirname(__DIR__);
$provider=(string)file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
$routes=(string)file_get_contents($root.'/routes/user.php');
$manager=(string)file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');
foreach(['DecisionProviderRegistryContract','InMemoryDecisionProviderRegistry','DecisionProviderGatewayContract','ContainerDecisionProviderGateway','DecisionWorkspaceContract','DecisionWorkspaceComposer'] as $needle){if(!str_contains($provider,$needle)){fwrite(STDERR,"FAIL provider missing {$needle}\n");exit(1);}}
foreach(['DecisionWorkspaceController','decide.show'] as $needle){if(!str_contains($routes,$needle)){fwrite(STDERR,"FAIL route missing {$needle}\n");exit(1);}}
if(substr_count($provider,'$this->registerRoutes();')!==1){fwrite(STDERR,"FAIL route registration must occur exactly once\n");exit(1);}
foreach(['decision_provider_registry','decide_scenario_workspace','recommendation_is_not_execution','auto_execute'] as $needle){if(!str_contains($manager,$needle)){fwrite(STDERR,"FAIL health missing {$needle}\n");exit(1);}}
if(preg_match('/use App\\\\Extensions\\\\TitanFinancial|use App\\\\Extensions\\\\TitanWisdom|use App\\\\Extensions\\\\TitanRisk/',$provider)){fwrite(STDERR,"FAIL provider hard-imports a decision authority\n");exit(1);}
echo "PASS14_BINDING_OK\n";
