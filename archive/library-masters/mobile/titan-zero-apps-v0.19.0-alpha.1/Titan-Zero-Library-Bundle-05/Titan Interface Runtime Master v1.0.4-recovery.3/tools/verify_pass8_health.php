<?php

declare(strict_types=1);
$root=dirname(__DIR__);
$manager=(string)file_get_contents($root.'/System/Services/TitanInterfaceRuntimeManager.php');
$controller=(string)file_get_contents($root.'/System/Http/Controllers/IndexController.php');
$view=(string)file_get_contents($root.'/resources/views/index.blade.php');
foreach(['ViewRegistryContract','LegacyDataSurfaceRegistryContract',"'read_authority'","'legacy_data_mode'"] as $n){if(!str_contains($manager,$n)){fwrite(STDERR,"FAIL manager {$n}\n");exit(1);}}
if(!preg_match("/'version' => '([0-9]+\.[0-9]+\.[0-9]+)'/",$manager,$v)||version_compare($v[1],'0.8.0','<')){fwrite(STDERR,"FAIL manager version regressed below Pass 8\n");exit(1);}
if(!preg_match("/'plan_pass' => ([0-9]+)/",$manager,$m)||(int)$m[1]<8){fwrite(STDERR,"FAIL manager pass regressed below 8\n");exit(1);}
foreach(['ViewRegistryContract','LegacyDataSurfaceRegistryContract','viewRegistry','legacyDataRegistry'] as $n){if(!str_contains($controller,$n)){fwrite(STDERR,"FAIL controller {$n}\n");exit(1);}}
foreach(['View registry','Legacy Data surfaces'] as $n){if(!str_contains($view,$n)){fwrite(STDERR,"FAIL view {$n}\n");exit(1);}}
echo "PASS8_HEALTH_DIAGNOSTICS_OK\n";
