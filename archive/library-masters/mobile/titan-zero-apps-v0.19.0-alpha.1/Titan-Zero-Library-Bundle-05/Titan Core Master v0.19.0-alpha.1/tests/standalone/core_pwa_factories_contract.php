<?php
$root=realpath(__DIR__.'/../..');
foreach(['System/Services/TitanAppsPwaManifestFactory.php','System/Services/TitanAppsServiceWorkerFactory.php'] as $rel) assert(is_file($root.'/'.$rel));
$manifest=file_get_contents($root.'/System/Services/TitanAppsPwaManifestFactory.php');
assert(str_contains($manifest,'TitanAppsApplicationRegistry'));
assert(str_contains($manifest,'AppSurface'));
$sw=file_get_contents($root.'/System/Services/TitanAppsServiceWorkerFactory.php');
foreach(['serviceWorker','scope','network-first','private API'] as $needle) assert(str_contains($sw,$needle));
echo "core_pwa_factories_contract: ok\n";
