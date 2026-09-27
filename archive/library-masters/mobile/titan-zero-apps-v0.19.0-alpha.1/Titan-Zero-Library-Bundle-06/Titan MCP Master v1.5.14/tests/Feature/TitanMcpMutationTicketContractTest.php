<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$catalogue = (string) file_get_contents($root.'/System/Mcp/Support/McpCatalogue.php');
$tools = (string) file_get_contents($root.'/System/Mcp/Tools/MutationCoordinationTools.php');
$service = (string) file_get_contents($root.'/System/Mcp/Support/MutationPreparationService.php');
$store = (string) file_get_contents($root.'/System/Mcp/Support/MutationTicketStore.php');
$transport = (string) file_get_contents($root.'/System/Http/Transport/McpTransportController.php');
$config = (string) file_get_contents($root.'/config/titan-mcp.php');

foreach (['titan_mutation_prepare','titan_mutation_commit','titan_mutation_status'] as $tool) {
    if (!str_contains($catalogue, "'{$tool}'")) { fwrite(STDERR, "Missing {$tool}\n"); exit(1); }
}
preg_match_all("/self::(?:read|write|coordinate)\\('([^']+)'/", $catalogue, $matches);
if (count($matches[1] ?? []) !== 34 || count(array_unique($matches[1] ?? [])) !== 34) {
    fwrite(STDERR, "Expected 34 unique MCP tools for v1.5.14\n"); exit(1);
}
foreach (['prepare','commit','status'] as $method) {
    if (!preg_match('/public function '.preg_quote($method, '/').'\\s*\\(/', $tools)) { fwrite(STDERR, "Missing coordination tool method {$method}\n"); exit(1); }
}
foreach (['prepare','assertCommittable','markCommitting','markCommitted','markFailed','publicView'] as $method) {
    if (!preg_match('/public function '.preg_quote($method, '/').'\\s*\\(/', $service)) { fwrite(STDERR, "Missing preparation service method {$method}\n"); exit(1); }
}
foreach (['create','read','replace'] as $method) {
    if (!preg_match('/public function '.preg_quote($method, '/').'\\s*\\(/', $store)) { fwrite(STDERR, "Missing ticket store method {$method}\n"); exit(1); }
}
foreach (['single_use','arguments_sha256','expires_at','preapproval_backups','actor_id'] as $needle) {
    if (!str_contains($service, $needle)) { fwrite(STDERR, "Mutation ticket contract missing {$needle}\n"); exit(1); }
}
if (!str_contains($transport, "version','1.5.14") && !str_contains($transport, "version', '1.5.14")) {
    fwrite(STDERR, "Transport default version not advanced to 1.5.14\n"); exit(1);
}
if (!str_contains($config, "'mutation_tickets'")) { fwrite(STDERR, "Mutation-ticket config missing\n"); exit(1); }

echo "Titan MCP mutation ticket contract: PASS\n";
