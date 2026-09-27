<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use RuntimeException;

final class MutationService
{
    public function __construct(
        private readonly string $projectRoot,
        private readonly PathGuard $guard,
        private readonly BackupManager $backups,
        private readonly ?AuditLogger $audit = null,
        private readonly int $maxWriteBytes = 1048576,
    ) {}

    public function backupScopeForPath(string $path): string
    {
        $relative = $this->guard->normalizeRelative($path);
        $target = $this->guard->resolve($relative);
        return $this->backupScopeForWrite($relative, $target);
    }

    /** @param array<string,mixed> $metadata */
    public function writeFile(string $path, string $content, ?string $expectedSha256, array $metadata): array
    {
        $this->audit?->assertReady();
        if (strlen($content) > max(1024, $this->maxWriteBytes)) {
            throw new RuntimeException('Repository write payload exceeds the configured maximum size.');
        }
        $relative = $this->guard->normalizeRelative($path);
        $target = $this->guard->resolve($relative);
        if (is_dir($target)) {
            throw new RuntimeException('writeFile cannot replace a directory.');
        }

        if ($expectedSha256 !== null) {
            if (!preg_match('/^[a-f0-9]{64}$/i', $expectedSha256)) {
                throw new RuntimeException('expectedSha256 must be a 64-character SHA-256 digest.');
            }
            if (!is_file($target) || is_link($target)) {
                throw new RuntimeException('Optimistic concurrency check failed; expected target file is missing.');
            }
            $actual = hash_file('sha256', $target);
            if (!is_string($actual) || !hash_equals(strtolower($expectedSha256), strtolower($actual))) {
                throw new RuntimeException('Optimistic concurrency check failed; target file changed.');
            }
        }

        // HARD INVARIANT: no target mutation occurs until a verified backup exists.
        $scope = $this->backupScopeForWrite($relative, $target);
        $backup = $this->backups->backupPaths([$scope], $metadata + [
            'operation' => 'write_file',
            'target_path' => $relative,
            'backup_scope' => $scope,
        ]);

        $mutationApplied = false;
        $temp = null;
        try {
            $parent = dirname($target);
            if (!is_dir($parent) && !mkdir($parent, 0755, true) && !is_dir($parent)) {
                throw new RuntimeException('Unable to create target parent directory.');
            }
            $temp = $target.'.titan-mcp.'.bin2hex(random_bytes(6)).'.tmp';
            if (file_put_contents($temp, $content, LOCK_EX) === false) {
                throw new RuntimeException('Unable to write temporary mutation file.');
            }
            $existingMode = is_file($target) ? (@fileperms($target) ?: null) : null;
            if (!rename($temp, $target)) {
                @unlink($temp);
                throw new RuntimeException('Unable to atomically replace target file.');
            }
            $temp = null;
            $mutationApplied = true;
            if (is_int($existingMode)) {
                @chmod($target, $existingMode & 0777);
            }

            $finalSha = hash_file('sha256', $target);
            if (!is_string($finalSha)) {
                throw new RuntimeException('Unable to hash final target file.');
            }
            $result = [
                'path' => $relative,
                'backup_id' => $backup['backup_id'],
                'backup_scope' => $scope,
                'sha256' => $finalSha,
                'bytes' => filesize($target),
            ];
            $this->audit?->record('filesystem.written', $metadata + $result);
            return $result;
        } catch (\Throwable $error) {
            if (is_string($temp) && is_file($temp)) @unlink($temp);
            if (!$mutationApplied) throw $error;
            $this->restoreFailedFilesystemCommit((string) $backup['backup_id'], [$scope], $metadata + [
                'operation' => 'write_file_commit_failure',
                'target_path' => $relative,
            ], $error);
        }
    }

    /** @param array<string,mixed> $metadata */
    public function replaceText(string $path, string $search, string $replacement, int $expectedOccurrences, ?string $expectedSha256, array $metadata): array
    {
        if ($search === '') throw new RuntimeException('Search text cannot be empty.');
        if ($expectedOccurrences < 1 || $expectedOccurrences > 1000) throw new RuntimeException('expectedOccurrences must be between 1 and 1000.');
        $relative = $this->guard->normalizeRelative($path);
        $target = $this->guard->resolve($relative);
        if (!is_file($target) || is_link($target)) throw new RuntimeException('Repository replace requires an existing regular file.');
        $content = file_get_contents($target);
        if (!is_string($content)) throw new RuntimeException('Unable to read repository replace target.');
        $count = substr_count($content, $search);
        if ($count !== $expectedOccurrences) {
            throw new RuntimeException("Repository replace occurrence check failed; expected {$expectedOccurrences}, found {$count}.");
        }
        $updated = str_replace($search, $replacement, $content, $replaced);
        if ($replaced !== $expectedOccurrences) throw new RuntimeException('Repository replace did not produce the expected replacement count.');
        $result = $this->writeFile($relative, $updated, $expectedSha256, $metadata + ['operation' => 'replace_text']);
        $result['replacements'] = $replaced;
        return $result;
    }

    /**
     * @param array<int,array<string,mixed>> $files
     * @param array<string,mixed> $metadata
     */
    public function batchWriteFiles(array $files, array $metadata): array
    {
        $this->audit?->assertReady();
        if ($files === [] || count($files) > 50) throw new RuntimeException('Batch write requires between 1 and 50 files.');
        $prepared = [];
        $scopes = [];
        $seen = [];
        $totalBytes = 0;
        foreach ($files as $index => $item) {
            if (!is_array($item)) throw new RuntimeException("Batch item {$index} must be an object.");
            $path = $item['path'] ?? null;
            $content = $item['content'] ?? null;
            $expected = $item['expected_sha256'] ?? $item['expectedSha256'] ?? null;
            if (!is_string($path) || !is_string($content)) throw new RuntimeException("Batch item {$index} requires string path and content.");
            $relative = $this->guard->normalizeRelative($path);
            if (isset($seen[$relative])) throw new RuntimeException("Batch write contains duplicate target '{$relative}'.");
            $seen[$relative] = true;
            $target = $this->guard->resolve($relative);
            if (is_dir($target)) throw new RuntimeException("Batch target '{$relative}' is a directory.");
            if ($expected !== null) {
                if (!is_string($expected) || !preg_match('/^[a-f0-9]{64}$/i', $expected)) throw new RuntimeException("Batch target '{$relative}' has invalid expected SHA-256.");
                if (!is_file($target) || is_link($target)) throw new RuntimeException("Batch optimistic concurrency failed for '{$relative}'; target is missing.");
                $actual = hash_file('sha256', $target);
                if (!is_string($actual) || !hash_equals(strtolower($expected), strtolower($actual))) throw new RuntimeException("Batch optimistic concurrency failed for '{$relative}'; target changed.");
            }
            $bytes = strlen($content);
            if ($bytes > max(1024, $this->maxWriteBytes)) throw new RuntimeException("Batch target '{$relative}' exceeds the configured per-file write limit.");
            $totalBytes += $bytes;
            if ($totalBytes > max(1024, $this->maxWriteBytes) * 10) throw new RuntimeException('Batch write exceeds the configured aggregate write limit.');
            $scope = $this->backupScopeForWrite($relative, $target);
            $prepared[] = compact('relative', 'target', 'content', 'scope');
            $scopes[$scope] = true;
        }

        // HARD INVARIANT: one verified backup covers every affected scope before the first file changes.
        $scopeList = array_keys($scopes);
        $backup = $this->backups->backupPaths($scopeList, $metadata + [
            'operation' => 'batch_write',
            'target_count' => count($prepared),
            'backup_scopes' => $scopeList,
        ]);

        $results = [];
        $mutationApplied = false;
        try {
            foreach ($prepared as $item) {
                $this->atomicWritePrepared($item['target'], $item['content']);
                $mutationApplied = true;
                $sha = hash_file('sha256', $item['target']);
                if (!is_string($sha)) throw new RuntimeException("Unable to hash batch target '{$item['relative']}'.");
                $results[] = ['path'=>$item['relative'], 'sha256'=>$sha, 'bytes'=>filesize($item['target'])];
            }
            $result = ['backup_id'=>$backup['backup_id'], 'backup_scopes'=>$scopeList, 'files'=>$results, 'count'=>count($results)];
            $this->audit?->record('filesystem.batch_written', $metadata + $result);
            return $result;
        } catch (\Throwable $error) {
            if (!$mutationApplied) throw $error;
            $this->restoreFailedFilesystemCommit((string)$backup['backup_id'], $scopeList, $metadata + ['operation'=>'batch_write_commit_failure'], $error);
        }
    }

    /** @param array<string,mixed> $metadata */
    public function makeDirectory(string $path, array $metadata): array
    {
        $this->audit?->assertReady();
        $relative = $this->guard->normalizeRelative($path);
        $target = $this->guard->resolve($relative);
        if (file_exists($target) || is_link($target)) throw new RuntimeException("Directory target '{$relative}' already exists.");
        $scope = $this->backupScopeForWrite($relative, $target);
        $backup = $this->backups->backupPaths([$scope], $metadata + ['operation'=>'mkdir', 'target_path'=>$relative, 'backup_scope'=>$scope]);
        $applied = false;
        try {
            if (!mkdir($target, 0755, true) && !is_dir($target)) throw new RuntimeException('Unable to create repository directory.');
            $applied = true;
            $result = ['path'=>$relative, 'created'=>true, 'backup_id'=>$backup['backup_id'], 'backup_scope'=>$scope];
            $this->audit?->record('filesystem.directory_created', $metadata + $result);
            return $result;
        } catch (\Throwable $error) {
            if (!$applied) throw $error;
            $this->restoreFailedFilesystemCommit((string)$backup['backup_id'], [$scope], $metadata + ['operation'=>'mkdir_commit_failure'], $error);
        }
    }

    private function atomicWritePrepared(string $target, string $content): void
    {
        $parent = dirname($target);
        if (!is_dir($parent) && !mkdir($parent, 0755, true) && !is_dir($parent)) throw new RuntimeException('Unable to create target parent directory.');
        $temp = $target.'.titan-mcp.'.bin2hex(random_bytes(6)).'.tmp';
        try {
            if (file_put_contents($temp, $content, LOCK_EX) === false) throw new RuntimeException('Unable to write temporary mutation file.');
            $mode = is_file($target) ? (@fileperms($target) ?: null) : null;
            if (!rename($temp, $target)) throw new RuntimeException('Unable to atomically replace target file.');
            if (is_int($mode)) @chmod($target, $mode & 0777);
        } finally {
            if (is_file($temp)) @unlink($temp);
        }
    }

    /** @param array<string,mixed> $metadata */
    public function deletePath(string $path, array $metadata): array
    {
        $this->audit?->assertReady();
        $relative = $this->guard->normalizeRelative($path);
        $target = $this->guard->resolve($relative);
        if (!file_exists($target) && !is_link($target)) {
            throw new RuntimeException("Delete target '{$relative}' does not exist.");
        }
        $backup = $this->backups->backupPaths([$relative], $metadata + ['operation' => 'delete_path']);
        $mutationStarted = false;
        try {
            $mutationStarted = true;
            $this->removeRecursively($target);
            $result = ['path' => $relative, 'deleted' => true, 'backup_id' => $backup['backup_id']];
            $this->audit?->record('filesystem.deleted', $metadata + $result);
            return $result;
        } catch (\Throwable $error) {
            if (!$mutationStarted) throw $error;
            $this->restoreFailedFilesystemCommit((string) $backup['backup_id'], [$relative], $metadata + [
                'operation' => 'delete_path_commit_failure',
                'target_path' => $relative,
            ], $error);
        }
    }

    /** @param array<string,mixed> $metadata */
    public function rollback(string $backupId, array $metadata): array
    {
        $this->audit?->assertReady();
        $manifest = $this->backups->manifest($backupId);
        $paths = array_map(static fn (array $entry): string => (string) $entry['path'], $manifest['paths']);
        if ($paths === []) {
            throw new RuntimeException('Backup has no restorable paths.');
        }

        // Rollback itself is a write, therefore current state is backed up first.
        $preRollback = $this->backups->backupPaths($paths, $metadata + [
            'operation' => 'pre_rollback',
            'restoring_backup_id' => $backupId,
        ]);

        try {
            $result = $this->backups->restore($backupId);
        } catch (\Throwable $restoreError) {
            // A multi-scope restore can fail after an earlier scope has already been activated.
            // Fail closed by restoring the verified pre-rollback snapshot before surfacing the error.
            // Recovery outcome is determined only by the restore itself; an unavailable/tampered
            // audit ledger must never turn a successful recovery into a false manual-recovery alert.
            try {
                $recovery = $this->backups->restore((string) $preRollback['backup_id']);
            } catch (\Throwable $recoveryError) {
                $this->safeAudit('filesystem.rollback_failed_unrecovered', $metadata + [
                    'backup_id' => $backupId,
                    'pre_rollback_backup_id' => $preRollback['backup_id'],
                    'restore_error' => $restoreError->getMessage(),
                    'recovery_error' => $recoveryError->getMessage(),
                ]);
                throw new RuntimeException(
                    'Filesystem rollback failed and automatic pre-rollback recovery also failed. '.
                    'Manual recovery is required using backup '.(string) $preRollback['backup_id'].'.',
                    0,
                    $restoreError,
                );
            }

            $this->safeAudit('filesystem.rollback_failed_recovered', $metadata + [
                'backup_id' => $backupId,
                'pre_rollback_backup_id' => $preRollback['backup_id'],
                'recovery' => $recovery,
                'error' => $restoreError->getMessage(),
            ]);
            throw new RuntimeException(
                'Filesystem rollback failed; the verified pre-rollback state was automatically restored. '.
                'Original restore error: '.$restoreError->getMessage(),
                0,
                $restoreError,
            );
        }

        $result['pre_rollback_backup_id'] = $preRollback['backup_id'];
        try {
            $this->audit?->record('filesystem.rolled_back', $metadata + $result);
        } catch (\Throwable $commitError) {
            // A rollback is itself a mutation. If its final audit commit cannot be
            // persisted, restore the verified state that existed immediately before
            // rollback so a failed MCP call never leaves the older state active.
            $this->restoreFailedFilesystemCommit(
                (string) $preRollback['backup_id'],
                $paths,
                $metadata + [
                    'operation' => 'rollback_commit_failure',
                    'requested_backup_id' => $backupId,
                ],
                $commitError,
            );
        }
        return $result;
    }

    /**
     * A mutation that cannot be durably verified/audited is not committed. Restore
     * the verified pre-write snapshot so a failed MCP call cannot leave changed state.
     *
     * @param list<string> $scopes
     * @param array<string,mixed> $metadata
     * @return never
     */
    private function restoreFailedFilesystemCommit(string $prewriteBackupId, array $scopes, array $metadata, \Throwable $cause): never
    {
        $failedStateBackupId = null;
        try {
            $failed = $this->backups->backupPaths($scopes, $metadata + [
                'operation' => 'failed_commit_state_snapshot',
                'prewrite_backup_id' => $prewriteBackupId,
            ]);
            $failedStateBackupId = (string) ($failed['backup_id'] ?? '');
        } catch (\Throwable) {
            // Recovery of the verified pre-write state takes priority. The original
            // backup remains protected by prewrite_backup_id during retention cleanup.
        }

        try {
            $this->backups->restore($prewriteBackupId);
        } catch (\Throwable $recoveryError) {
            $this->safeAudit('filesystem.commit_failed_unrecovered', $metadata + [
                'prewrite_backup_id' => $prewriteBackupId,
                'failed_state_backup_id' => $failedStateBackupId,
                'commit_error' => $cause->getMessage(),
                'recovery_error' => $recoveryError->getMessage(),
            ]);
            throw new RuntimeException(
                'Filesystem mutation failed after target state changed and automatic recovery also failed. Manual recovery is required using backup '.$prewriteBackupId.'.',
                0,
                $cause,
            );
        }

        $this->safeAudit('filesystem.commit_failed_recovered', $metadata + [
            'prewrite_backup_id' => $prewriteBackupId,
            'failed_state_backup_id' => $failedStateBackupId,
            'commit_error' => $cause->getMessage(),
        ]);
        throw new RuntimeException(
            'Filesystem mutation failed during final commit verification/audit; the verified pre-write state was automatically restored. Original error: '.$cause->getMessage(),
            0,
            $cause,
        );
    }

    /** @param array<string,mixed> $context */
    private function safeAudit(string $event, array $context): void
    {
        if ($this->audit === null) return;
        try { $this->audit->record($event, $context); } catch (\Throwable) {}
    }

    private function backupScopeForWrite(string $relative, string $target): string
    {
        if (file_exists($target) || is_link($target)) {
            return $relative;
        }
        $segments = explode('/', $relative);
        $current = rtrim($this->projectRoot, DIRECTORY_SEPARATOR);
        foreach ($segments as $index => $segment) {
            $current .= DIRECTORY_SEPARATOR.$segment;
            if (!file_exists($current) && !is_link($current)) {
                return implode('/', array_slice($segments, 0, $index + 1));
            }
        }
        return $relative;
    }

    private function removeRecursively(string $path): void
    {
        if (!file_exists($path) && !is_link($path)) {
            return;
        }
        if (is_link($path) || is_file($path)) {
            if (!unlink($path)) {
                throw new RuntimeException("Unable to remove '{$path}'.");
            }
            return;
        }
        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($items as $item) {
            if ($item->isDir() && !$item->isLink()) {
                if (!rmdir($item->getPathname())) {
                    throw new RuntimeException("Unable to remove directory '{$item->getPathname()}'.");
                }
            } else {
                if (!unlink($item->getPathname())) {
                    throw new RuntimeException("Unable to remove '{$item->getPathname()}'.");
                }
            }
        }
        if (!rmdir($path)) {
            throw new RuntimeException("Unable to remove directory '{$path}'.");
        }
    }
}
