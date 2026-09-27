<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$catalogue = file_get_contents($root.'/System/Mcp/Support/McpCatalogue.php') ?: '';
$mutationTools = file_get_contents($root.'/System/Mcp/Tools/MutationTools.php') ?: '';
$mutationService = file_get_contents($root.'/System/Mcp/Support/MutationService.php') ?: '';
$invoker = file_get_contents($root.'/System/Http/Transport/McpToolInvoker.php') ?: '';
$transport = file_get_contents($root.'/System/Http/Transport/McpTransportController.php') ?: '';

$required = ['titan_repository_replace','titan_repository_batch_write','titan_repository_mkdir'];
foreach ($required as $tool) {
    if (!str_contains($catalogue, "'{$tool}'")) { fwrite(STDERR, "Missing {$tool}\n"); exit(1); }
}
foreach (['replace','batchWrite','mkdir'] as $method) {
    if (!preg_match('/public function '.preg_quote($method, '/').'\s*\(/', $mutationTools)) { fwrite(STDERR, "Missing tool method {$method}\n"); exit(1); }
}
foreach (['replaceText','batchWriteFiles','makeDirectory'] as $method) {
    if (!preg_match('/public function '.preg_quote($method, '/').'\s*\(/', $mutationService)) { fwrite(STDERR, "Missing service method {$method}\n"); exit(1); }
}
if (!str_contains($mutationService, "operation' => 'batch_write'")) { fwrite(STDERR, "Batch write backup operation missing\n"); exit(1); }
if (!str_contains($mutationService, 'backupPaths($scopes')) { fwrite(STDERR, "Batch write must back up all scopes before writes\n"); exit(1); }
if (!str_contains($invoker, "'description' =>")) { fwrite(STDERR, "Agent-facing schema descriptions missing\n"); exit(1); }
if (!str_contains($transport, "'isError'=>true") && !str_contains($transport, "'isError' => true")) { fwrite(STDERR, "Structured tool error result missing\n"); exit(1); }

echo "Titan MCP coding write tools contract: PASS\n";
