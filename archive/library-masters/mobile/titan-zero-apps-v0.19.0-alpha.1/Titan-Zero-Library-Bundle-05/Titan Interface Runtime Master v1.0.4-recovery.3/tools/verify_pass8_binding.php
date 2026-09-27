<?php

declare(strict_types=1);
$root=dirname(__DIR__);
$provider=(string)file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
$config=(string)file_get_contents($root.'/config/titan-interface-runtime.php');
$required=[
 'ViewRegistryContract::class','LegacyDataSurfaceRegistryContract::class','ReadCacheContract::class',
 'ReadAuthorityRouterContract::class','DataModeProjectorContract::class','LegacyRouteLocatorContract::class',
 'AuthorizedViewReader::class','ContainerReadModelAuthorityAdapter::class','LegacyRouteReadAuthorityAdapter::class',
];
foreach($required as $needle){if(!str_contains($provider,$needle)){fwrite(STDERR,"FAIL missing provider binding {$needle}\n");exit(1);}}
foreach(["'read' => [","'legacy_data' => [","'max_per_page' => 200","'embed_policy' => 'deep-link'"] as $needle){if(!str_contains($config,$needle)){fwrite(STDERR,"FAIL missing config {$needle}\n");exit(1);}}
echo "PASS8_BINDINGS_OK\n";
