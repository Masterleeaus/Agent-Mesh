<?php

declare(strict_types=1);
$root=dirname(__DIR__,2);
$config=(string)file_get_contents($root.'/config/titan-mcp.php');
foreach (["'destructive'", 'TITAN_MCP_DESTRUCTIVE_ENABLED', 'storage/app/titan-mcp', "'.env'"] as $needle) {
    if (!str_contains($config,$needle)) { fwrite(STDERR,"Missing security contract: {$needle}\n"); exit(1); }
}
$provider=(string)file_get_contents($root.'/System/TitanMcpServiceProvider.php');
if (!str_contains($provider,'UninstallExtensionServiceProviderInterface') || !str_contains($provider,'ExtensionRegisterKeyProviderInterface')) exit(1);
echo "Titan MCP extension security contract PASS\n";
