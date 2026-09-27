<?php

declare(strict_types=1);
$root=dirname(__DIR__);$provider=(string)file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');$routes=(string)file_get_contents($root.'/routes/user.php');
foreach(['CollectionViewPreferenceStoreContract','LaravelSessionCollectionViewPreferenceStore','CollectionViewSwitcherContract','CollectionViewSwitcher'] as$n){if(!str_contains($provider,$n)){fwrite(STDERR,"FAIL provider missing {$n}\n");exit(1);}}
foreach(['CollectionViewController','collections.show'] as$n){if(!str_contains($routes,$n)){fwrite(STDERR,"FAIL route missing {$n}\n");exit(1);}}
if(preg_match('/use App\\\\Extensions\\\\(?:TitanCRM|TitanField|TitanConnect|TitanMaps|TitanFinance|TitanBuilder|TitanInteraction)/',$provider)){fwrite(STDERR,"FAIL provider hard-imports another extension concrete type\n");exit(1);}
echo "PASS12_BINDING_OK\n";
