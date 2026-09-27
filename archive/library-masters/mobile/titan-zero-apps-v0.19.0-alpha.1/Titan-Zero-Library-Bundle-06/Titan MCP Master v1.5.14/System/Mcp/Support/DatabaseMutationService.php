<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use Illuminate\Database\DatabaseManager;
use InvalidArgumentException;
use RuntimeException;

final class DatabaseMutationService
{
    public function __construct(
        private readonly DatabaseManager $db,
        private readonly DatabaseBackupManager $backups,
        private readonly AuditLogger $audit,
        private readonly SqlGuard $sqlGuard,
        private readonly ?DatabaseWritePolicy $writePolicy = null,
    ) {}

    /** @param array<int|string,mixed> $bindings @param array<string,mixed> $metadata */
    public function execute(string $sql, array $bindings, ?string $connection, array $metadata): array
    {
        $this->audit->assertReady();
        $this->assertMutationInputBounds($sql, $bindings);
        $analysis = $this->sqlGuard->assertMutation($sql);
        $statement = $analysis['statement'];
        if ($analysis['destructive'] && !($metadata['destructive_authorized'] ?? false)) {
            throw new InvalidArgumentException('Destructive database mutation requires destructive capability authorization.');
        }
        $connectionName = $this->resolveWriteConnection($connection);

        // HARD INVARIANT: full verified DB snapshot before every database write.
        $backup = $this->backups->backup($connectionName, $metadata + [
            'operation' => 'database_mutation',
            'sql_sha256' => hash('sha256', $statement),
        ]);
        if (!($this->backups->verify((string) $backup['backup_id'])['valid'] ?? false)) {
            throw new InvalidArgumentException('Database backup failed verification; mutation blocked.');
        }

        try {
            $conn = $this->db->connection($connectionName);
            $affected = $conn->affectingStatement($statement, $bindings);
        } catch (\Throwable $executionError) {
            try {
                $recovery = $this->backups->restore((string) $backup['backup_id']);
            } catch (\Throwable $recoveryError) {
                $this->safeAudit('database.mutation_failed_unrecovered', $metadata + [
                    'backup_id' => $backup['backup_id'],
                    'connection' => $connectionName,
                    'sql_sha256' => hash('sha256', $statement),
                    'execution_error' => $executionError->getMessage(),
                    'recovery_error' => $recoveryError->getMessage(),
                ]);
                throw new RuntimeException(
                    'Database mutation failed and automatic recovery also failed. Manual recovery is required using backup '.(string) $backup['backup_id'].'.',
                    0,
                    $executionError,
                );
            }

            $this->safeAudit('database.mutation_failed_recovered', $metadata + [
                'backup_id' => $backup['backup_id'],
                'connection' => $connectionName,
                'sql_sha256' => hash('sha256', $statement),
                'recovery' => $recovery,
                'error' => $executionError->getMessage(),
            ]);
            throw new RuntimeException(
                'Database mutation failed; the verified pre-mutation state was automatically restored. Original execution error: '.$executionError->getMessage(),
                0,
                $executionError,
            );
        }

        $result = [
            'executed' => true,
            'affected' => $affected,
            'backup_id' => $backup['backup_id'],
            'connection' => $connectionName,
            'destructive' => $analysis['destructive'],
        ];
        try {
            $this->audit->record('database.mutated', $metadata + [
                'backup_id' => $backup['backup_id'],
                'connection' => $connectionName,
                'sql_sha256' => hash('sha256', $statement),
                'affected' => $affected,
                'destructive' => $analysis['destructive'],
            ]);
        } catch (\Throwable $commitError) {
            $this->restoreFailedDatabaseCommit(
                (string) $backup['backup_id'],
                $connectionName,
                $metadata + ['sql_sha256' => hash('sha256', $statement)],
                $commitError,
            );
        }
        return $result;
    }

    /** @param array<string,mixed> $metadata */
    public function rollback(string $backupId, array $metadata): array
    {
        $this->audit->assertReady();
        $connection = $this->resolveWriteConnection($this->backups->connectionForBackup($backupId));
        $pre = $this->backups->backup($connection, $metadata + [
            'operation' => 'database_pre_rollback',
            'restoring_backup_id' => $backupId,
        ]);
        if (!($this->backups->verify((string) $pre['backup_id'])['valid'] ?? false)) {
            throw new InvalidArgumentException('Pre-rollback database backup failed verification; rollback blocked.');
        }

        try {
            $result = $this->backups->restore($backupId);
        } catch (\Throwable $restoreError) {
            try {
                $recovery = $this->backups->restore((string) $pre['backup_id']);
            } catch (\Throwable $recoveryError) {
                $this->safeAudit('database.rollback_failed_unrecovered', $metadata + [
                    'backup_id' => $backupId,
                    'pre_rollback_backup_id' => $pre['backup_id'],
                    'restore_error' => $restoreError->getMessage(),
                    'recovery_error' => $recoveryError->getMessage(),
                ]);
                throw new RuntimeException(
                    'Database rollback failed and automatic pre-rollback recovery also failed. Manual recovery is required using backup '.(string) $pre['backup_id'].'.',
                    0,
                    $restoreError,
                );
            }
            $this->safeAudit('database.rollback_failed_recovered', $metadata + [
                'backup_id' => $backupId,
                'pre_rollback_backup_id' => $pre['backup_id'],
                'recovery' => $recovery,
                'error' => $restoreError->getMessage(),
            ]);
            throw new RuntimeException(
                'Database rollback failed; the verified pre-rollback state was automatically restored. Original restore error: '.$restoreError->getMessage(),
                0,
                $restoreError,
            );
        }

        $result['pre_rollback_backup_id'] = $pre['backup_id'];
        try {
            $this->audit->record('database.rolled_back', $metadata + $result);
        } catch (\Throwable $commitError) {
            // A rollback is itself a mutation. If its commit/audit cannot be durably
            // recorded, restore the state that existed immediately before rollback.
            $this->restoreFailedDatabaseCommit(
                (string) $pre['backup_id'],
                $connection,
                $metadata + ['requested_backup_id' => $backupId],
                $commitError,
            );
        }
        return $result;
    }

    /** @param array<string,mixed> $metadata @return never */
    private function restoreFailedDatabaseCommit(string $prewriteBackupId, string $connection, array $metadata, \Throwable $cause): never
    {
        $failedStateBackupId = null;
        try {
            $failed = $this->backups->backup($connection, $metadata + [
                'operation' => 'database_failed_commit_state_snapshot',
                'prewrite_backup_id' => $prewriteBackupId,
            ]);
            $failedStateBackupId = (string) ($failed['backup_id'] ?? '');
        } catch (\Throwable) {
            // Preserve consistency over diagnostics if a secondary snapshot cannot be made.
        }

        try {
            $this->backups->restore($prewriteBackupId);
        } catch (\Throwable $recoveryError) {
            $this->safeAudit('database.commit_failed_unrecovered', $metadata + [
                'prewrite_backup_id' => $prewriteBackupId,
                'failed_state_backup_id' => $failedStateBackupId,
                'commit_error' => $cause->getMessage(),
                'recovery_error' => $recoveryError->getMessage(),
            ]);
            throw new RuntimeException(
                'Database mutation failed during final commit and automatic recovery also failed. Manual recovery is required using backup '.$prewriteBackupId.'.',
                0,
                $cause,
            );
        }

        $this->safeAudit('database.commit_failed_recovered', $metadata + [
            'prewrite_backup_id' => $prewriteBackupId,
            'failed_state_backup_id' => $failedStateBackupId,
            'commit_error' => $cause->getMessage(),
        ]);
        throw new RuntimeException(
            'Database mutation failed during final commit verification/audit; the verified pre-write state was automatically restored. Original error: '.$cause->getMessage(),
            0,
            $cause,
        );
    }

    /** @param array<string,mixed> $context */
    private function safeAudit(string $event, array $context): void
    {
        try { $this->audit->record($event, $context); } catch (\Throwable) {}
    }

    /** @param array<int|string,mixed> $bindings */
    private function assertMutationInputBounds(string $sql, array $bindings): void
    {
        $maxSql = max(1024, (int) config('titan_mcp.database.max_write_sql_chars', 100000));
        if (strlen($sql) > $maxSql) {
            throw new InvalidArgumentException('Database mutation SQL exceeds configured maximum length.');
        }
        $maxBindings = max(0, (int) config('titan_mcp.database.max_write_bindings', 200));
        if (count($bindings) > $maxBindings) {
            throw new InvalidArgumentException('Database mutation has too many bindings.');
        }
    }

    private function resolveWriteConnection(?string $connection): string
    {
        if ($this->writePolicy !== null) {
            return $this->writePolicy->resolve($connection);
        }
        $default = (string) config('database.default');
        $resolved = $connection ?: $default;
        if ($resolved !== $default) {
            throw new RuntimeException("Database write connection '{$resolved}' is not allowlisted.");
        }
        return $resolved;
    }
}
