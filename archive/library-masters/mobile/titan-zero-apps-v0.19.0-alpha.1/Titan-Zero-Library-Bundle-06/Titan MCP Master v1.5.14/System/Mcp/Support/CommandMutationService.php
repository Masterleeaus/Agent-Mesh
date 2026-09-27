<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use RuntimeException;
use Symfony\Component\Process\Process;

final class CommandMutationService
{
    public function __construct(
        private readonly string $projectRoot,
        private readonly BackupManager $backups,
        private readonly DatabaseBackupManager $databaseBackups,
        private readonly AuditLogger $audit,
        private readonly SecretRedactor $redactor,
        private readonly CommandExecutionPolicy $policy,
    ) {}

    /**
     * @param list<string> $arguments
     * @param list<string> $backupPaths
     * @param array<string,mixed> $metadata
     */
    public function artisan(string $command, array $arguments, array $backupPaths, bool $databaseMayChange, array $metadata): array
    {
        $this->audit->assertReady();
        if (!preg_match('/^[a-z0-9:_-]+$/i', $command)) {
            throw new RuntimeException('Invalid Artisan command name.');
        }
        if ($this->isDeniedCommand($command)) {
            throw new RuntimeException("Artisan command '{$command}' is not exposed through Titan MCP.");
        }
        if ($this->policy->isDestructiveMutation($command) && !($metadata['destructive_authorized'] ?? false)) {
            throw new RuntimeException('Destructive Artisan command requires destructive capability authorization.');
        }

        $plan = $this->policy->mutationPlan($command, $arguments, $backupPaths, $databaseMayChange);
        $effectiveBackupPaths = $plan['backup_paths'];
        $effectiveDatabaseMayChange = $plan['database_may_change'];
        $databaseConnection = $plan['database_connection'];
        $recipe = $plan['recipe'];

        $governanceMetadata = $metadata + [
            'command' => $command,
            'backup_recipe' => $recipe,
            'backup_paths' => $effectiveBackupPaths,
            'database_connection' => $databaseConnection,
        ];

        $fsBackup = $effectiveBackupPaths !== []
            ? $this->backups->backupPaths($effectiveBackupPaths, $governanceMetadata + ['operation' => 'command_prewrite'])
            : null;
        if ($fsBackup !== null && !$this->backups->verify((string) $fsBackup['backup_id'])['valid']) {
            throw new RuntimeException('Filesystem command backup failed verification; execution blocked.');
        }

        $dbBackup = $effectiveDatabaseMayChange
            ? $this->databaseBackups->backup($databaseConnection, $governanceMetadata + ['operation' => 'command_db_prewrite'])
            : null;
        if ($dbBackup !== null && !$this->databaseBackups->verify((string) $dbBackup['backup_id'])['valid']) {
            throw new RuntimeException('Database command backup failed verification; execution blocked.');
        }

        $process = new Process(
            array_merge([PHP_BINARY, 'artisan', $command], $arguments),
            $this->projectRoot,
            null,
            null,
            (float) config('titan_mcp.execution.timeout_seconds', 600)
        );
        $process->run();
        $max = (int) config('titan_mcp.execution.max_output_chars', 20000);
        $exitCode = $process->getExitCode();
        $result = [
            'succeeded' => $exitCode === 0,
            'exit_code' => $exitCode,
            'stdout' => $this->redactor->redact(substr($process->getOutput(), 0, $max)),
            'stderr' => $this->redactor->redact(substr($process->getErrorOutput(), 0, $max)),
            'filesystem_backup_id' => $fsBackup['backup_id'] ?? null,
            'database_backup_id' => $dbBackup['backup_id'] ?? null,
            'backup_paths' => $effectiveBackupPaths,
            'database_connection' => $databaseConnection,
            'backup_recipe' => $recipe,
            'destructive' => $this->policy->isDestructiveMutation($command),
        ];

        if ($exitCode !== 0) {
            if (config('titan_mcp.execution.recover_failed_mutations', true)) {
                $result += $this->recoverFailedCommand($fsBackup, $dbBackup, $governanceMetadata + ['arguments' => $arguments]);
            } else {
                $result += ['recovered' => false, 'recovery_status' => 'disabled'];
                $this->safeAudit('command.failed', $governanceMetadata + ['arguments' => $arguments] + $result);
            }
            return $result;
        }

        $result += ['recovered' => false, 'recovery_status' => 'not_required'];
        try {
            $this->audit->record('command.executed', $governanceMetadata + ['arguments' => $arguments] + $result);
        } catch (\Throwable $commitError) {
            $this->restoreFailedCommandCommit(
                $fsBackup,
                $dbBackup,
                $governanceMetadata + ['arguments' => $arguments],
                $commitError,
            );
        }
        return $result;
    }

    /**
     * @param array<string,mixed>|null $fsBackup
     * @param array<string,mixed>|null $dbBackup
     * @param array<string,mixed> $metadata
     * @return array<string,mixed>
     */
    private function recoverFailedCommand(?array $fsBackup, ?array $dbBackup, array $metadata): array
    {
        $failureFs = null;
        $failureDb = null;
        try {
            if ($fsBackup !== null) {
                $manifest = $this->backups->manifest((string) $fsBackup['backup_id']);
                $paths = array_values(array_filter(array_map(
                    static fn (array $entry): string => (string) ($entry['path'] ?? ''),
                    (array) ($manifest['paths'] ?? [])
                )));
                if ($paths !== []) {
                    $failureFs = $this->backups->backupPaths($paths, $metadata + [
                        'operation' => 'command_failed_state_pre_recovery',
                        'prewrite_backup_id' => $fsBackup['backup_id'],
                    ]);
                    if (!($this->backups->verify((string) $failureFs['backup_id'])['valid'] ?? false)) {
                        throw new RuntimeException('Failed-command filesystem state snapshot did not verify.');
                    }
                }
            }
            if ($dbBackup !== null) {
                $connection = $this->databaseBackups->connectionForBackup((string) $dbBackup['backup_id']);
                $failureDb = $this->databaseBackups->backup($connection, $metadata + [
                    'operation' => 'command_failed_database_state_pre_recovery',
                    'prewrite_backup_id' => $dbBackup['backup_id'],
                ]);
                if (!($this->databaseBackups->verify((string) $failureDb['backup_id'])['valid'] ?? false)) {
                    throw new RuntimeException('Failed-command database state snapshot did not verify.');
                }
            }
        } catch (\Throwable $snapshotError) {
            $result = [
                'recovered' => false,
                'recovery_status' => 'blocked_failure_state_snapshot',
                'failure_state_filesystem_backup_id' => $failureFs['backup_id'] ?? null,
                'failure_state_database_backup_id' => $failureDb['backup_id'] ?? null,
                'recovery_error' => $snapshotError->getMessage(),
            ];
            $this->safeAudit('command.failed_recovery_blocked', $metadata + $result);
            return $result;
        }

        try {
            if ($dbBackup !== null) $this->databaseBackups->restore((string) $dbBackup['backup_id']);
            if ($fsBackup !== null) $this->backups->restore((string) $fsBackup['backup_id']);
        } catch (\Throwable $restoreError) {
            $partialRecoveryErrors = [];
            try {
                if ($failureDb !== null) $this->databaseBackups->restore((string) $failureDb['backup_id']);
            } catch (\Throwable $e) { $partialRecoveryErrors[] = 'database: '.$e->getMessage(); }
            try {
                if ($failureFs !== null) $this->backups->restore((string) $failureFs['backup_id']);
            } catch (\Throwable $e) { $partialRecoveryErrors[] = 'filesystem: '.$e->getMessage(); }

            $result = [
                'recovered' => false,
                'recovery_status' => $partialRecoveryErrors === []
                    ? 'prewrite_restore_failed_partial_state_restored'
                    : 'prewrite_restore_failed_partial_state_recovery_failed',
                'failure_state_filesystem_backup_id' => $failureFs['backup_id'] ?? null,
                'failure_state_database_backup_id' => $failureDb['backup_id'] ?? null,
                'recovery_error' => $restoreError->getMessage(),
                'partial_state_recovery_errors' => $partialRecoveryErrors,
            ];
            $this->safeAudit('command.failed_recovery_failed', $metadata + $result);
            if ($partialRecoveryErrors !== []) {
                throw new RuntimeException(
                    'Mutating command failed, automatic pre-write recovery failed, and restoring the captured failure state also failed. Manual recovery is required.',
                    0,
                    $restoreError,
                );
            }
            return $result;
        }

        $result = [
            'recovered' => true,
            'recovery_status' => 'restored_prewrite_state',
            'failure_state_filesystem_backup_id' => $failureFs['backup_id'] ?? null,
            'failure_state_database_backup_id' => $failureDb['backup_id'] ?? null,
        ];
        $this->safeAudit('command.failed_recovered', $metadata + $result);
        return $result;
    }

    /**
     * A zero-exit command is not committed if its audit commit cannot be persisted.
     * Restore every verified pre-write scope before surfacing the failure.
     *
     * @param array<string,mixed>|null $fsBackup
     * @param array<string,mixed>|null $dbBackup
     * @param array<string,mixed> $metadata
     * @return never
     */
    private function restoreFailedCommandCommit(?array $fsBackup, ?array $dbBackup, array $metadata, \Throwable $cause): never
    {
        $failedFs = null;
        $failedDb = null;
        // Best-effort forensic snapshot of the command's successful-but-uncommitted state.
        try {
            if ($fsBackup !== null) {
                $manifest = $this->backups->manifest((string) $fsBackup['backup_id']);
                $paths = array_values(array_filter(array_map(
                    static fn (array $entry): string => (string) ($entry['path'] ?? ''),
                    (array) ($manifest['paths'] ?? [])
                )));
                if ($paths !== []) {
                    $failedFs = $this->backups->backupPaths($paths, $metadata + [
                        'operation' => 'command_commit_failed_state_snapshot',
                        'prewrite_backup_id' => $fsBackup['backup_id'],
                    ]);
                }
            }
        } catch (\Throwable) {}
        try {
            if ($dbBackup !== null) {
                $connection = $this->databaseBackups->connectionForBackup((string) $dbBackup['backup_id']);
                $failedDb = $this->databaseBackups->backup($connection, $metadata + [
                    'operation' => 'command_commit_failed_database_state_snapshot',
                    'prewrite_backup_id' => $dbBackup['backup_id'],
                ]);
            }
        } catch (\Throwable) {}

        try {
            if ($dbBackup !== null) $this->databaseBackups->restore((string) $dbBackup['backup_id']);
            if ($fsBackup !== null) $this->backups->restore((string) $fsBackup['backup_id']);
        } catch (\Throwable $recoveryError) {
            $this->safeAudit('command.commit_failed_unrecovered', $metadata + [
                'filesystem_backup_id' => $fsBackup['backup_id'] ?? null,
                'database_backup_id' => $dbBackup['backup_id'] ?? null,
                'failed_state_filesystem_backup_id' => $failedFs['backup_id'] ?? null,
                'failed_state_database_backup_id' => $failedDb['backup_id'] ?? null,
                'commit_error' => $cause->getMessage(),
                'recovery_error' => $recoveryError->getMessage(),
            ]);
            throw new RuntimeException(
                'Artisan mutation completed but final commit/audit failed, and automatic pre-write recovery also failed. Manual recovery is required.',
                0,
                $cause,
            );
        }

        $this->safeAudit('command.commit_failed_recovered', $metadata + [
            'filesystem_backup_id' => $fsBackup['backup_id'] ?? null,
            'database_backup_id' => $dbBackup['backup_id'] ?? null,
            'failed_state_filesystem_backup_id' => $failedFs['backup_id'] ?? null,
            'failed_state_database_backup_id' => $failedDb['backup_id'] ?? null,
            'commit_error' => $cause->getMessage(),
        ]);
        throw new RuntimeException(
            'Artisan mutation completed but final commit/audit failed; the verified pre-write state was automatically restored. Original error: '.$cause->getMessage(),
            0,
            $cause,
        );
    }

    /** @param array<string,mixed> $context */
    private function safeAudit(string $event, array $context): void
    {
        try { $this->audit->record($event, $context); } catch (\Throwable) {}
    }

    private function isDeniedCommand(string $command): bool
    {
        foreach ((array) config('titan_mcp.execution.denied_commands', []) as $pattern) {
            if (fnmatch((string) $pattern, $command)) {
                return true;
            }
        }
        return false;
    }


}
