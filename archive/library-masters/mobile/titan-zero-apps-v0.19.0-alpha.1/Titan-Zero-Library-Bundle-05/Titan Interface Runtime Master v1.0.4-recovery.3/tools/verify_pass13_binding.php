<?php

declare(strict_types=1);
$root=dirname(__DIR__);$provider=(string)file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');$routes=(string)file_get_contents($root.'/routes/user.php');
foreach(['SpatialWorkspaceContract','SpatialWorkspaceComposer'] as$n){if(!str_contains($provider,$n)){fwrite(STDERR,"FAIL provider missing {$n}\n");exit(1);}}
foreach(['SpatialWorkspaceController','spatial.show'] as$n){if(!str_contains($routes,$n)){fwrite(STDERR,"FAIL route missing {$n}\n");exit(1);}}
if(preg_match('/use App\\\\Extensions\\\\TitanMapsIntelligence\\\\/',$provider)){fwrite(STDERR,"FAIL provider hard-imports Titan Maps Intelligence concrete types\n");exit(1);}
if(preg_match('/use App\\\\Extensions\\\\TitanMapsIntelligence\\\\/',(string)file_get_contents($root.'/System/Spatial/SpatialWorkspaceComposer.php'))){fwrite(STDERR,"FAIL spatial composer hard-imports Titan Maps Intelligence concrete types\n");exit(1);}
echo "PASS13_BINDING_OK\n";
