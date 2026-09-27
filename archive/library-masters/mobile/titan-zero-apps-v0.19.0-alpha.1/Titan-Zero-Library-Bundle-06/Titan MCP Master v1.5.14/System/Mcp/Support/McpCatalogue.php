<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use App\Extensions\TitanMcp\System\Mcp\Tools\BackupTools;
use App\Extensions\TitanMcp\System\Mcp\Tools\CommandTools;
use App\Extensions\TitanMcp\System\Mcp\Tools\DatabaseMutationTools;
use App\Extensions\TitanMcp\System\Mcp\Tools\MutationTools;
use App\Extensions\TitanMcp\System\Mcp\Tools\MutationCoordinationTools;
use App\Extensions\TitanMcp\System\Mcp\Tools\OperationsTools;
use App\Extensions\TitanMcp\System\Mcp\Tools\RecoveryTools;
use App\Extensions\TitanMcp\System\Mcp\Tools\ProjectTools;
use App\Extensions\TitanMcp\System\Mcp\Tools\RepositoryTools;
use App\Extensions\TitanMcp\System\Mcp\Tools\RuntimeTools;
use App\Extensions\TitanMcp\System\Mcp\Tools\SchemaTools;

final class McpCatalogue
{
    /** @return array<int, array<string,mixed>> */
    public static function tools(): array
    {
        return [
            self::read('titan_project_info', 'Project Info', 'Read bounded Titan Zero project identity, locked direct package inventory, safe application/MCP URLs, database connection names and extension-estate counts.', 'titan.mcp.read', ProjectTools::class, 'projectInfo', 'project'),
            self::read('titan_extensions_list', 'Extensions List', 'List the Titan extension estate with identity metadata, architecture counts, aggregate inventory, artifacts and case-collision evidence.', 'titan.mcp.read', ProjectTools::class, 'extensionsList', 'project'),
            self::read('titan_extension_inspect', 'Extension Inspect', 'Inspect one exact-cased Titan extension and return bounded architecture paths plus static, non-executing Eloquent model metadata inspired by the Laravel Loop donor.', 'titan.mcp.read', ProjectTools::class, 'extensionInspect', 'project'),
            self::read('titan_repository_read', 'Repository Read', 'Read a bounded, policy-approved repository file while denying secret paths and redacting credential-bearing content before it reaches the MCP client.', 'titan.mcp.repository.read', RepositoryTools::class, 'read', 'repository'),
            self::read('titan_repository_list', 'Repository List', 'List a bounded repository path deterministically with visible totals and truncation evidence while enforcing Titan repository path policy.', 'titan.mcp.repository.read', RepositoryTools::class, 'list', 'repository'),
            self::read('titan_repository_search', 'Repository Search', 'Search approved repository roots for deterministic occurrence-level matches with path, line, column, SHA-256 and bounded redacted excerpts.', 'titan.mcp.repository.read', RepositoryTools::class, 'search', 'repository'),
            self::read('titan_schema_tables', 'Schema Tables', 'List bounded normalized database table metadata from the default or explicitly allowlisted read connection, with optional filtering and truncation evidence.', 'titan.mcp.database.read', SchemaTools::class, 'tables', 'database'),
            self::read('titan_schema_table', 'Schema Table', 'Inspect one validated database table and return normalized columns, grouped indexes and foreign-key targets from an allowlisted read connection.', 'titan.mcp.database.read', SchemaTools::class, 'table', 'database'),
            self::read('titan_database_query_readonly', 'Database Query Read Only', 'Execute one hardened, bounded SQL read against a dedicated query-only database connection (disabled by default) and return credential-redacted rows with truncation evidence.', 'titan.mcp.database.read', SchemaTools::class, 'queryReadonly', 'database'),
            self::read('titan_runtime_health', 'Runtime Health', 'Read bounded Titan runtime diagnostics including version, dependency, cache, route, maintenance and writable-path health without exposing raw secrets or absolute paths.', 'titan.mcp.runtime.read', RuntimeTools::class, 'health', 'runtime'),
            self::read('titan_routes_search', 'Routes Search', 'Search Laravel routes deterministically with bounded results, method counts and redaction so routing evidence can be used safely during diagnosis and planning.', 'titan.mcp.runtime.read', RuntimeTools::class, 'routes', 'runtime'),
            self::read('titan_logs_recent', 'Logs Recent', 'Read bounded application log entries, group multiline traces, identify the latest error and redact credentials from every returned field.', 'titan.mcp.logs.read', RuntimeTools::class, 'recentLogs', 'runtime'),
            self::read('titan_config_search', 'Config Search', 'Search loaded Laravel configuration keys with credential-redacted values; matching is key-only so secret values are never used as search evidence.', 'titan.mcp.runtime.read', OperationsTools::class, 'configSearch', 'operations'),
            self::read('titan_migrations_status', 'Migrations Status', 'Compare discovered application and extension migration files with the migrations ledger and return bounded ran/pending status without executing migrations.', 'titan.mcp.database.read', OperationsTools::class, 'migrationsStatus', 'operations'),
            self::read('titan_queue_status', 'Queue Status', 'Inspect the configured queue driver and bounded pending/failed job counts when the host queue tables are available.', 'titan.mcp.runtime.read', OperationsTools::class, 'queueStatus', 'operations'),
            self::read('titan_scheduler_list', 'Scheduler List', 'List registered Laravel scheduler events, cron expressions and overlap/server posture without executing scheduled jobs.', 'titan.mcp.runtime.read', OperationsTools::class, 'schedulerList', 'operations'),
            self::read('titan_permissions_summary', 'Permissions Summary', 'Inspect Titan MCP permission definitions and role-level grant counts without exposing users or credential material.', 'titan.mcp.admin', OperationsTools::class, 'permissionsSummary', 'security'),
            self::read('titan_audit_status', 'Audit Status', 'Verify the Titan MCP tamper-evident audit ledger and return integrity, entry and storage-size status without exposing audit payload secrets.', 'titan.mcp.backups.read', RecoveryTools::class, 'auditStatus', 'recovery'),
            self::read('titan_backups_list', 'Backups List', 'List bounded filesystem/database recovery points with manifest verification state and redacted metadata without reading backup payload contents.', 'titan.mcp.backups.read', RecoveryTools::class, 'backupsList', 'recovery'),
            self::coordinate('titan_mutation_prepare', 'Mutation Prepare', 'Create and verify the pre-approval recovery backup(s) for one exact Titan mutation intent, then return a short-lived single-use ticket bound to the actor, tool and canonical argument hash. Use this before human approval in Codee or other governed clients.', 'titan.mcp.access', MutationCoordinationTools::class, 'prepare', 'coordination'),
            self::write('titan_mutation_commit', 'Mutation Commit', 'Commit one previously prepared Titan mutation ticket. Titan re-verifies the ticket and pre-approval backup(s), enforces the original tool permissions again, atomically consumes the ticket, then invokes the exact stored arguments and returns both approval-backup and mutation-backup evidence.', 'titan.mcp.access', MutationCoordinationTools::class, 'commit', 'coordination'),
            self::read('titan_mutation_status', 'Mutation Status', 'Read the redacted lifecycle and backup evidence for one mutation ticket owned by the current actor without exposing the stored mutation arguments.', 'titan.mcp.read', MutationCoordinationTools::class, 'status', 'coordination'),
            self::write('titan_repository_write', 'Repository Write', 'Create or replace one policy-approved repository file only after a verified filesystem backup; supports optimistic SHA-256 concurrency protection and audited rollback metadata.', 'titan.mcp.repository.write', MutationTools::class, 'write', 'repository'),
            self::write('titan_repository_replace', 'Repository Replace', 'Replace an exact text occurrence set inside one approved file. Titan reads the current file, validates expected SHA-256 and occurrence count, creates and verifies a pre-write backup, then atomically commits the replacement.', 'titan.mcp.repository.write', MutationTools::class, 'replace', 'repository'),
            self::write('titan_repository_batch_write', 'Repository Batch Write', 'Atomically create or replace multiple approved repository files. Titan resolves every target and creates one verified backup covering all affected scopes before the first write; any failure restores the whole pre-write batch state.', 'titan.mcp.repository.write', MutationTools::class, 'batchWrite', 'repository'),
            self::write('titan_repository_mkdir', 'Repository Make Directory', 'Create one approved repository directory only after a verified backup captures the exact creation scope, returning rollback metadata for the new path.', 'titan.mcp.repository.write', MutationTools::class, 'mkdir', 'repository'),
            self::write('titan_repository_delete', 'Repository Delete', 'Delete one policy-approved repository path only behind the destructive gate and only after a verified filesystem backup preserves rollback evidence.', 'titan.mcp.repository.destructive', MutationTools::class, 'delete', 'repository'),
            self::write('titan_repository_rollback', 'Repository Rollback', 'Restore a verified filesystem backup only after first snapshotting the current target state, with automatic recovery if the requested rollback fails.', 'titan.mcp.repository.destructive', MutationTools::class, 'rollback', 'repository'),
            self::read('titan_backup_verify', 'Backup Verify', 'Verify a Titan filesystem or database backup manifest, payload integrity and recovery metadata without mutating project or database state.', 'titan.mcp.backups.read', BackupTools::class, 'verify', 'backup'),
            self::read('titan_backup_manifest', 'Backup Manifest', 'Read a credential-redacted Titan backup manifest for recovery inspection without exposing backup payload secrets or mutating state.', 'titan.mcp.backups.read', BackupTools::class, 'manifest', 'backup'),
            self::write('titan_database_mutate', 'Database Mutate', 'Execute one governed database mutation only after a full verified backup of the exact writable connection, with destructive SQL gates and fail-closed recovery on errors.', 'titan.mcp.database.write', DatabaseMutationTools::class, 'mutate', 'database'),
            self::write('titan_database_rollback', 'Database Rollback', 'Restore a verified database backup to its bound database target only after snapshotting current state, with target-drift protection and rollback-failure recovery.', 'titan.mcp.database.destructive', DatabaseMutationTools::class, 'rollback', 'database'),
            self::read('titan_artisan_readonly', 'Artisan Read Only', 'Run one allowlisted read-only Artisan diagnostic command with strict per-command argument policy, execution kill-switch enforcement and credential-redacted output.', 'titan.mcp.execute.read', CommandTools::class, 'readonly', 'command'),
            self::write('titan_artisan_mutate', 'Artisan Mutate', 'Run one governed mutating Artisan command only from the server-side mutation allowlist with a complete derived backup recipe; all listed mutation commands require destructive authority.', 'titan.mcp.execute.write', CommandTools::class, 'mutate', 'command'),
        ];
    }

    /** @return array<int, string> */
    public static function names(): array
    {
        return array_column(self::tools(), 'name');
    }

    public static function contractHash(): string
    {
        $json = json_encode(self::tools(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        return hash('sha256', $json);
    }

    /** @return array<string,mixed> */
    private static function read(string $name, string $title, string $description, string $capability, string $handler, string $method, string $category): array
    {
        return self::definition($name, $title, $description, $capability, $handler, $method, $category, true, false, true);
    }

    /** Stateful coordination writes only protected recovery/ticket metadata, not the requested business target. @return array<string,mixed> */
    private static function coordinate(string $name, string $title, string $description, string $capability, string $handler, string $method, string $category): array
    {
        return self::definition($name, $title, $description, $capability, $handler, $method, $category, false, false, false);
    }

    /** @return array<string,mixed> */
    private static function write(string $name, string $title, string $description, string $capability, string $handler, string $method, string $category): array
    {
        // destructiveHint means "may perform destructive updates", not merely "writes".
        return self::definition($name, $title, $description, $capability, $handler, $method, $category, false, self::isDestructive($name), false);
    }

    /** @return array<string,mixed> */
    private static function definition(string $name, string $title, string $description, string $capability, string $handler, string $method, string $category, bool $readOnly, bool $destructive, bool $idempotent): array
    {
        return [
            'name'=>$name,
            'title'=>$title,
            'description'=>$description,
            'capability'=>$capability,
            'handler'=>$handler,
            'method'=>$method,
            'category'=>$category,
            'annotations'=>[
                'readOnlyHint'=>$readOnly,
                'destructiveHint'=>$destructive,
                'idempotentHint'=>$idempotent,
                'openWorldHint'=>false,
            ],
            'client_policy'=>self::clientPolicy($name, $readOnly, $destructive),
        ];
    }

    private static function isDestructive(string $name): bool
    {
        return in_array($name, [
            'titan_mutation_commit',
            'titan_repository_delete','titan_repository_rollback',
            'titan_database_mutate','titan_database_rollback','titan_artisan_mutate',
        ], true);
    }

    /** @return array<string,mixed> */
    private static function clientPolicy(string $name, bool $readOnly, bool $destructive): array
    {
        $ticketable = in_array($name, [
            'titan_repository_write','titan_repository_replace','titan_repository_batch_write','titan_repository_mkdir',
            'titan_repository_delete','titan_repository_rollback','titan_database_mutate','titan_database_rollback','titan_artisan_mutate',
        ], true);
        $classification = $readOnly ? 'READ' : ($name === 'titan_mutation_prepare' ? 'COORDINATE' : ($destructive ? 'DESTRUCTIVE' : 'WRITE'));
        $backupDomains = str_starts_with($name, 'titan_repository_') && $ticketable
            ? ['repository']
            : (str_starts_with($name, 'titan_database_') && $ticketable
                ? ['database']
                : ($name === 'titan_artisan_mutate' ? ['runtime','database'] : []));
        $postWrite = match ($name) {
            'titan_repository_write','titan_repository_replace','titan_repository_batch_write' => 'sha256-readback',
            'titan_repository_mkdir','titan_repository_delete' => 'repository-state-readback',
            'titan_repository_rollback','titan_database_mutate','titan_database_rollback','titan_artisan_mutate','titan_mutation_commit' => 'server-commit-evidence',
            'titan_mutation_prepare' => 'preapproval-backup-evidence',
            default => 'none',
        };
        return [
            'schema'=>'titan-mcp-tool-policy/1',
            'classification'=>$classification,
            'ticketable'=>$ticketable,
            'preferred_mutation_flow'=>$ticketable ? 'prepare-commit' : 'direct',
            'backup_domains'=>$backupDomains,
            'exact_arguments_required'=>$ticketable,
            'post_write_verification'=>$postWrite,
        ];
    }
}
