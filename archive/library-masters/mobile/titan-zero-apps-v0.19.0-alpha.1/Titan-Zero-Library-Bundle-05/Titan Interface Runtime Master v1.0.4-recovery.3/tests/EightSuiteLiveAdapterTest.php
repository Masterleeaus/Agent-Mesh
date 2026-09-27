<?php
$root=dirname(__DIR__);
$p=file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
foreach(['InstalledBuilderCatalogue','InstalledVisualRuntimeBridge','InteractionEngineActionIntentDispatcher'] as $needle){
    if(!str_contains($p,$needle)){fwrite(STDERR,"FAIL missing $needle\n");exit(1);}
}
foreach([
 'System/Catalogue/InstalledBuilderCatalogue.php',
 'System/Visual/InstalledVisualRuntimeBridge.php',
 'System/Actions/InteractionEngineActionIntentDispatcher.php',
] as $rel){if(!is_file($root.'/'.$rel)){fwrite(STDERR,"FAIL missing $rel\n");exit(1);}}
echo "EIGHT_SUITE_LIVE_ADAPTERS: PASS\n";
