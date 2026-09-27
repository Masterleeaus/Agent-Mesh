<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require_once $root.'/System/Mcp/Support/McpCatalogue.php';

$tools = \App\Extensions\TitanMcp\System\Mcp\Support\McpCatalogue::tools();
if (count($tools) !== 34) { fwrite(STDERR, "Expected 34 Titan MCP tools\n"); exit(1); }
$byName = [];
foreach ($tools as $tool) $byName[$tool['name']] = $tool;

foreach ($tools as $tool) {
    $policy = $tool['client_policy'] ?? null;
    if (!is_array($policy) || ($policy['schema'] ?? null) !== 'titan-mcp-tool-policy/1') {
        fwrite(STDERR, "Missing v1.5 client policy for {$tool['name']}\n"); exit(1);
    }
    if (!in_array($policy['classification'] ?? null, ['READ','WRITE','EXECUTE','DESTRUCTIVE','COORDINATE'], true)) {
        fwrite(STDERR, "Invalid client classification for {$tool['name']}\n"); exit(1);
    }
    if (!is_array($policy['backup_domains'] ?? null)) { fwrite(STDERR, "Missing backup domains for {$tool['name']}\n"); exit(1); }
}

$assert = static function (bool $ok, string $message): void { if (!$ok) { fwrite(STDERR, $message."\n"); exit(1); } };
$assert(($byName['titan_repository_write']['annotations']['destructiveHint'] ?? null) === false, 'Repository write must not advertise destructiveHint=true');
$assert(($byName['titan_repository_write']['client_policy']['classification'] ?? null) === 'WRITE', 'Repository write policy must be WRITE');
$assert(($byName['titan_repository_write']['client_policy']['ticketable'] ?? null) === true, 'Repository write must be ticketable');
$assert(($byName['titan_repository_write']['client_policy']['backup_domains'] ?? null) === ['repository'], 'Repository write must advertise repository backup domain');
$assert(($byName['titan_repository_delete']['client_policy']['classification'] ?? null) === 'DESTRUCTIVE', 'Repository delete must be DESTRUCTIVE');
$assert(($byName['titan_artisan_readonly']['client_policy']['classification'] ?? null) === 'READ', 'Read-only Artisan must classify READ');
$assert(($byName['titan_database_query_readonly']['client_policy']['classification'] ?? null) === 'READ', 'Read-only database query must classify READ');
$assert(($byName['titan_backup_verify']['client_policy']['classification'] ?? null) === 'READ', 'Backup verify must classify READ');
$assert(($byName['titan_mutation_prepare']['client_policy']['classification'] ?? null) === 'COORDINATE', 'Mutation prepare must classify COORDINATE');
$assert(($byName['titan_mutation_prepare']['annotations']['destructiveHint'] ?? null) === false, 'Mutation prepare must be non-destructive');

$invoker = (string) file_get_contents($root.'/System/Http/Transport/McpToolInvoker.php');
foreach (["'_meta'", 'io.titanzero/tool-policy', "client_policy"] as $needle) {
    if (!str_contains($invoker, $needle)) { fwrite(STDERR, "Tool catalogue does not expose {$needle}\n"); exit(1); }
}
$transport = (string) file_get_contents($root.'/System/Http/Transport/McpTransportController.php');
foreach (['titan-mcp-client-contract/1','exact_argument_preservation_required','titan_mutation_prepare','titan_mutation_commit'] as $needle) {
    if (!str_contains($transport, $needle)) { fwrite(STDERR, "Initialize contract missing {$needle}\n"); exit(1); }
}
$service = (string) file_get_contents($root.'/System/Mcp/Support/MutationPreparationService.php');
foreach (['approval_evidence','titan-mcp-approval-evidence/1','backup_domains','manifest_sha256','exact_arguments_bound'] as $needle) {
    if (!str_contains($service, $needle)) { fwrite(STDERR, "Mutation approval evidence missing {$needle}\n"); exit(1); }
}

$coordination=(string) file_get_contents($root.'/System/Mcp/Tools/MutationCoordinationTools.php');
foreach (['post_commit_evidence','titan-mcp-post-commit-evidence/1','server_committed','verification_level'] as $needle) { if (!str_contains($coordination,$needle)) { fwrite(STDERR, "Mutation commit evidence missing {$needle}\n"); exit(1); } }

echo "Titan MCP v1.5 client policy/evidence contract: PASS\n";
