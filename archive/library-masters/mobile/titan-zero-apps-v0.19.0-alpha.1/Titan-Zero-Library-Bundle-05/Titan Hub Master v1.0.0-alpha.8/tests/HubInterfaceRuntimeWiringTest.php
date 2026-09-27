<?php
$root=dirname(__DIR__);
$p=file_get_contents($root.'/System/Presentation/AdaptiveHubPresentationBridge.php');
$sp=file_get_contents($root.'/System/TitanHubServiceProvider.php');
function hir(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
hir(str_contains($p,'HubWorkspaceSpecFactory'),'presentation bridge consumes workspace spec factory');
hir(str_contains($p,"method_exists(\$runtime,'execute')"),'canonical Interface Runtime execute branch retained');
hir(str_contains($p,'new $contextClass('),'canonical InterfaceContext construction retained');
hir(str_contains($sp,'HubWorkspaceSpecFactory::class'),'workspace spec factory registered');
$execute=strpos($p,"method_exists(\$runtime,'execute')");
$compose=strpos($p,"method_exists(\$runtime,'compose')");
hir($execute!==false && $compose!==false && $execute<$compose,'canonical execute precedes compatibility adapters');
