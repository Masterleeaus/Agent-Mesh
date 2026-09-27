<?php

declare(strict_types=1);
$root=dirname(__DIR__);$provider=(string)file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');$routes=(string)file_get_contents($root.'/routes/user.php');
foreach(['InteractionEngineGatewayContract','TitanInteractionEngineGateway','InteractionPresentationAdapter'] as$n){if(!str_contains($provider,$n)){fwrite(STDERR,"FAIL provider missing {$n}\n");exit(1);}}
foreach(['InteractionPresentationController','interaction.present','chat|panel|full-workspace'] as$n){if(!str_contains($routes,$n)){fwrite(STDERR,"FAIL route missing {$n}\n");exit(1);}}
if(str_contains($provider,'use App\\Extensions\\InteractionEngine\\')){fwrite(STDERR,"FAIL provider hard-imports Interaction Engine concrete type\n");exit(1);}
echo "PASS9_BINDING_OK\n";
