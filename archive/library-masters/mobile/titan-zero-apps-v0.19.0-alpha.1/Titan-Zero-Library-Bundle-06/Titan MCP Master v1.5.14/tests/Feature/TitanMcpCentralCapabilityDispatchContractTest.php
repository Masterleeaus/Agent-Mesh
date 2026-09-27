<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$invoker = (string) file_get_contents($root.'/System/Http/Transport/McpToolInvoker.php');
$catalogue = (string) file_get_contents($root.'/System/Mcp/Support/McpCatalogue.php');

foreach (['CapabilityGate', 'Auth::user()', "definition['capability']"] as $needle) {
    if (!str_contains($invoker, $needle)) { fwrite(STDERR, "Central MCP capability dispatch gate missing {$needle}\n"); exit(1); }
}
if (!str_contains($catalogue, "'capability'=>$capability")) {
    fwrite(STDERR, "MCP catalogue capability declaration missing\n"); exit(1);
}
$gatePos = strpos($invoker, 'capabilityGate->assert');
$makePos = strpos($invoker, "container->make");
if ($gatePos === false || $makePos === false || $gatePos > $makePos) {
    fwrite(STDERR, "Capability must be enforced before tool handler dispatch\n"); exit(1);
}

echo "Titan MCP central capability dispatch contract PASS\n";
