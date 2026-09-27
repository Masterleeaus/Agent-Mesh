<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use Illuminate\Database\DatabaseManager;
use RuntimeException;
use Symfony\Component\Process\Process;

class DatabaseBackupManager
{
    private string $normalizedBackupRoot;

    public function __construct(
        private readonly DatabaseManager $db,
        private readonly string $backupRoot,
        private readonly ?BackupRetentionManager $retention = null,
    ) {
        $this->normalizedBackupRoot = $this->normalizeAbsolutePath($backupRoot);
    }

    /** @param array<string,mixed> $metadata */
    public function backup(?string $connection = null, array $metadata = []): array
    {
        $connectionName = $this->resolveConnectionName($connection);
        $config = $this->connectionConfig($connectionName);
        $driver = strtolower((string) ($config['driver'] ?? ''));
        $this->assertSupportedDriver($driver);
        $this->assertBackupRootSafe(true);

        $id = gmdate('Ymd_His').'_db_'.bin2hex(random_bytes(8));
        $dir = $this->backupDirectory($id, false);
        if (!mkdir($dir, 0700) || !is_dir($dir)) {
            throw new RuntimeException('Unable to create database backup directory.');
        }
        @chmod($dir, 0700);

        $dumpPath = $dir.DIRECTORY_SEPARATOR.'database.dump';
        try {
            if ($driver === 'sqlite') {
                $this->prepareSqliteForCopy($connectionName);
            }

            match ($driver) {
                'mysql', 'mariadb' => $this->dumpMySql($config, $dumpPath),
                'pgsql' => $this->dumpPostgres($connectionName, $config, $dumpPath),
                'sqlite' => $this->dumpSqlite($config, $dumpPath),
                default => throw new RuntimeException("Database backup driver '{$driver}' is not supported."),
            };

            $dump = $this->fileSnapshot($dumpPath, 'Database dump');
            @chmod($dumpPath, 0600);
            $manifest = [
                'schema' => 3,
                'backup_id' => $id,
                'created_at' => gmdate(DATE_ATOM),
                'integrity' => [
                    'algorithm' => 'sha256',
                    'manifest_checksum' => 'manifest.sha256',
                ],
                'connection' => $connectionName,
                'driver' => $driver,
                'database' => $this->databaseLabel($config, $driver),
                'target_fingerprint' => $this->targetFingerprint($config, $driver),
                // Kept at top level for schema-2 consumer compatibility.
                'sha256' => $dump['sha256'],
                'bytes' => $dump['bytes'],
                'dump' => [
                    'file' => 'database.dump',
                    'sha256' => $dump['sha256'],
                    'bytes' => $dump['bytes'],
                ],
                'metadata' => $metadata,
            ];
            $this->validateManifestStructure($manifest);

            $manifestPath = $dir.DIRECTORY_SEPARATOR.'manifest.json';
            $checksumPath = $dir.DIRECTORY_SEPARATOR.'manifest.sha256';
            $encoded = json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            $this->writeAtomic($manifestPath, $encoded, 0600);
            $this->writeAtomic($checksumPath, hash('sha256', $encoded)."\n", 0600);

            $verification = $this->verify($id);
            if (!($verification['valid'] ?? false)) {
                throw new RuntimeException('Database backup verification failed; mutation is blocked: '.implode('; ', (array) ($verification['errors'] ?? [])));
            }

            return $manifest + [
                'dump_path' => $dumpPath,
                'manifest_sha256' => hash('sha256', $encoded),
                'valid' => true,
                'retention_cleanup' => $this->runRetentionCleanup($metadata),
            ];
        } catch (\Throwable $e) {
            $this->removeDirectory($dir);
            throw $e;
        }
    }

    /** @return array<string,mixed>|null */
    private function runRetentionCleanup(array $metadata = []): ?array
    {
        if ($this->retention === null) return null;
        try {
            $protected = [];
            foreach (['restoring_backup_id', 'prewrite_backup_id', 'backup_id'] as $key) {
                if (isset($metadata[$key]) && is_string($metadata[$key]) && $metadata[$key] !== '') $protected[] = $metadata[$key];
            }
            return $this->retention->prune(
                $this->normalizedBackupRoot,
                fn (string $id): bool => (bool) ($this->verify($id)['valid'] ?? false),
                null,
                $protected,
            );
        } catch (\Throwable $e) {
            return ['enabled' => true, 'error' => $e->getMessage(), 'deleted' => []];
        }
    }

    /** @return array{backup_id:string,valid:bool,bytes:int,errors:list<string>,target_matches_current:?bool} */
    public function verify(string $backupId): array
    {
        try {
            $manifest = $this->loadManifest($backupId, true);
            $dir = $this->backupDirectory($backupId, true);
            $dumpPath = $dir.DIRECTORY_SEPARATOR.'database.dump';
            if (!is_file($dumpPath) || is_link($dumpPath)) {
                throw new RuntimeException('Database backup payload is missing or unsafe.');
            }
            $snapshot = $this->fileSnapshot($dumpPath, 'Database backup payload');
            $expectedHash = strtolower((string) ($manifest['dump']['sha256'] ?? $manifest['sha256'] ?? ''));
            $expectedBytes = (int) ($manifest['dump']['bytes'] ?? $manifest['bytes'] ?? -1);
            if (!preg_match('/^[a-f0-9]{64}$/', $expectedHash) || !hash_equals($expectedHash, $snapshot['sha256'])) {
                throw new RuntimeException('Database backup payload checksum mismatch.');
            }
            if ($expectedBytes !== $snapshot['bytes']) {
                throw new RuntimeException('Database backup payload size mismatch.');
            }

            $targetMatches = null;
            if ((int) ($manifest['schema'] ?? 0) >= 3) {
                try {
                    $config = $this->connectionConfig((string) $manifest['connection']);
                    $targetMatches = hash_equals(
                        (string) $manifest['target_fingerprint'],
                        $this->targetFingerprint($config, strtolower((string) $manifest['driver']))
                    );
                } catch (\Throwable) {
                    $targetMatches = false;
                }
            }

            return [
                'backup_id' => $backupId,
                'valid' => true,
                'bytes' => $snapshot['bytes'],
                'errors' => [],
                'target_matches_current' => $targetMatches,
            ];
        } catch (\Throwable $e) {
            return [
                'backup_id' => $backupId,
                'valid' => false,
                'bytes' => 0,
                'errors' => [$e->getMessage()],
                'target_matches_current' => false,
            ];
        }
    }

    /** @return array<string,mixed> */
    public function manifest(string $backupId): array
    {
        return $this->loadManifest($backupId, true);
    }

    public function connectionForBackup(string $backupId): string
    {
        return (string) $this->manifest($backupId)['connection'];
    }

    /** Caller must create a fresh pre-restore backup before invoking restore. */
    public function restore(string $backupId): array
    {
        $manifest = $this->manifest($backupId);
        $verification = $this->verify($backupId);
        if (!($verification['valid'] ?? false)) {
            throw new RuntimeException('Database backup verification failed.');
        }

        $schema = (int) ($manifest['schema'] ?? 0);
        if ($schema < 3 && !config('titan_mcp.backups.allow_legacy_database_restore', false)) {
            throw new RuntimeException('Legacy unsealed database backups are verification-only; restore requires explicit legacy opt-in.');
        }

        $connectionName = (string) $manifest['connection'];
        $config = $this->connectionConfig($connectionName);
        $driver = strtolower((string) ($manifest['driver'] ?? ''));
        if (strtolower((string) ($config['driver'] ?? '')) !== $driver) {
            throw new RuntimeException('Database restore driver no longer matches the recorded backup target.');
        }
        if ($schema >= 3 && !hash_equals((string) $manifest['target_fingerprint'], $this->targetFingerprint($config, $driver))) {
            throw new RuntimeException('Database restore target changed since backup; restore blocked.');
        }

        $dumpPath = $this->backupDirectory($backupId, true).DIRECTORY_SEPARATOR.'database.dump';
        if (in_array($driver, ['mysql', 'mariadb', 'pgsql'], true)) {
            $this->prepareExactRestoreTarget($connectionName, $driver);
        }
        $this->disconnect($connectionName);
        try {
            match ($driver) {
                'mysql', 'mariadb' => $this->restoreMySql($config, $dumpPath),
                'pgsql' => $this->restorePostgres($config, $dumpPath),
                'sqlite' => $this->restoreSqlite($config, $dumpPath, $manifest),
                default => throw new RuntimeException('Unsupported database restore driver.'),
            };
        } finally {
            $this->purge($connectionName);
        }

        return [
            'restored' => true,
            'backup_id' => $backupId,
            'connection' => $connectionName,
            'artifact_verified' => true,
            'target_fingerprint_verified' => $schema >= 3,
        ];
    }

    private function resolveConnectionName(?string $connection): string
    {
        $name = trim((string) ($connection ?: config('database.default')));
        if ($name === '' || preg_match('/^[A-Za-z0-9_.-]+$/', $name) !== 1) {
            throw new RuntimeException('Invalid database connection name.');
        }
        return $name;
    }

    /** @return array<string,mixed> */
    private function connectionConfig(string $connectionName): array
    {
        $config = config("database.connections.{$connectionName}");
        if (!is_array($config)) {
            throw new RuntimeException("Unknown database connection '{$connectionName}'.");
        }
        return $config;
    }

    private function assertSupportedDriver(string $driver): void
    {
        if (!in_array($driver, ['mysql', 'mariadb', 'pgsql', 'sqlite'], true)) {
            throw new RuntimeException("Database backup driver '{$driver}' is not supported.");
        }
    }

    private function dumpMySql(array $config, string $path): void
    {
        $binary = (string) config('titan_mcp.backups.mysqldump_binary', 'mysqldump');
        $temp = $path.'.tmp.'.bin2hex(random_bytes(6));
        $args = [$binary, '--single-transaction', '--skip-lock-tables', '--quick', '--routines', '--triggers', '--events', '--hex-blob'];
        if (!empty($config['host'])) { $args[] = '--host='.(string) $config['host']; }
        if (!empty($config['port'])) { $args[] = '--port='.(string) $config['port']; }
        if (!empty($config['username'])) { $args[] = '--user='.(string) $config['username']; }
        if (!empty($config['charset'])) { $args[] = '--default-character-set='.(string) $config['charset']; }
        $args[] = '--result-file='.$temp;
        $args[] = (string) ($config['database'] ?? '');
        try {
            $this->run($args, ['MYSQL_PWD' => (string) ($config['password'] ?? '')]);
            $this->finalizeDump($temp, $path);
        } finally {
            if (file_exists($temp) || is_link($temp)) @unlink($temp);
        }
    }

    private function dumpPostgres(string $connectionName, array $config, string $path): void
    {
        $binary = (string) config('titan_mcp.backups.pg_dump_binary', 'pg_dump');
        $temp = $path.'.tmp.'.bin2hex(random_bytes(6));
        $schema = $this->currentPostgresSchema($connectionName);
        $args = [$binary, '--format=p', '--no-owner', '--no-privileges', '--schema='.$schema, '--file='.$temp];
        if (!empty($config['host'])) { $args[] = '--host='.(string) $config['host']; }
        if (!empty($config['port'])) { $args[] = '--port='.(string) $config['port']; }
        if (!empty($config['username'])) { $args[] = '--username='.(string) $config['username']; }
        $args[] = (string) ($config['database'] ?? '');
        try {
            $this->run($args, ['PGPASSWORD' => (string) ($config['password'] ?? '')]);
            $this->finalizeDump($temp, $path);
        } finally {
            if (file_exists($temp) || is_link($temp)) @unlink($temp);
        }
    }

    private function dumpSqlite(array $config, string $path): void
    {
        $source = (string) ($config['database'] ?? '');
        if ($source === '' || !is_file($source) || is_link($source)) {
            throw new RuntimeException('SQLite database source is missing or unsafe.');
        }
        $before = $this->fileSnapshot($source, 'SQLite source');
        $temp = $path.'.tmp.'.bin2hex(random_bytes(6));
        try {
            if (!copy($source, $temp)) {
                throw new RuntimeException('Unable to copy SQLite database backup.');
            }
            $after = $this->fileSnapshot($source, 'SQLite source');
            $copied = $this->fileSnapshot($temp, 'SQLite backup copy');
            if (!hash_equals($before['sha256'], $after['sha256']) || $before['bytes'] !== $after['bytes']) {
                throw new RuntimeException('SQLite database changed during backup; inconsistent snapshot rejected.');
            }
            if (!hash_equals($before['sha256'], $copied['sha256']) || $before['bytes'] !== $copied['bytes']) {
                throw new RuntimeException('SQLite backup copy failed verification.');
            }
            $this->finalizeDump($temp, $path);
        } finally {
            if (file_exists($temp) || is_link($temp)) @unlink($temp);
        }
    }

    /**
     * Exact restore removes current objects that may not exist in the snapshot.
     * This runs only inside a governed restore path where current state has already been backed up.
     */
    private function prepareExactRestoreTarget(string $connectionName, string $driver): void
    {
        $connection = $this->db->connection($connectionName);
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $connection->statement('SET FOREIGN_KEY_CHECKS=0');
            try {
                $views = $connection->select('SELECT TABLE_NAME AS name FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME');
                foreach ($views as $row) {
                    $name = (string) (((array) $row)['name'] ?? '');
                    if ($name !== '') $connection->statement('DROP VIEW IF EXISTS '.$this->quoteMysqlIdentifier($name));
                }
                $tables = $connection->select("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
                foreach ($tables as $row) {
                    $name = (string) (((array) $row)['name'] ?? '');
                    if ($name !== '') $connection->statement('DROP TABLE IF EXISTS '.$this->quoteMysqlIdentifier($name));
                }
                $routines = $connection->select('SELECT ROUTINE_NAME AS name, ROUTINE_TYPE AS type FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() ORDER BY ROUTINE_TYPE, ROUTINE_NAME');
                foreach ($routines as $row) {
                    $data = (array) $row;
                    $name = (string) ($data['name'] ?? '');
                    $type = strtoupper((string) ($data['type'] ?? ''));
                    if ($name !== '' && in_array($type, ['FUNCTION', 'PROCEDURE'], true)) {
                        $connection->statement('DROP '.$type.' IF EXISTS '.$this->quoteMysqlIdentifier($name));
                    }
                }
                $events = $connection->select('SELECT EVENT_NAME AS name FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE() ORDER BY EVENT_NAME');
                foreach ($events as $row) {
                    $name = (string) (((array) $row)['name'] ?? '');
                    if ($name !== '') $connection->statement('DROP EVENT IF EXISTS '.$this->quoteMysqlIdentifier($name));
                }
            } finally {
                $connection->statement('SET FOREIGN_KEY_CHECKS=1');
            }
            return;
        }

        if ($driver === 'pgsql') {
            $schema = $this->currentPostgresSchema($connectionName);
            $quoted = $this->quotePostgresIdentifier($schema);
            // pg_dump --schema selects the schema object itself as well as its
            // contents. Drop the current schema and let the verified plain dump
            // recreate it; pre-creating it would make psql ON_ERROR_STOP fail.
            $connection->statement('DROP SCHEMA '.$quoted.' CASCADE');
            return;
        }

        throw new RuntimeException('Exact restore cleanup is not supported for this database driver.');
    }

    private function currentPostgresSchema(string $connectionName): string
    {
        $rows = $this->db->connection($connectionName)->select('SELECT current_schema() AS schema_name');
        $schema = isset($rows[0]) ? (string) (((array) $rows[0])['schema_name'] ?? '') : '';
        if ($schema === '' || preg_match('/^[A-Za-z_][A-Za-z0-9_$]*$/', $schema) !== 1) {
            throw new RuntimeException('Unable to resolve a safe PostgreSQL application schema for backup/restore.');
        }
        return $schema;
    }

    private function quoteMysqlIdentifier(string $identifier): string
    {
        if ($identifier === '' || str_contains($identifier, "\0")) throw new RuntimeException('Unsafe MySQL restore object name.');
        return '`'.str_replace('`', '``', $identifier).'`';
    }

    private function quotePostgresIdentifier(string $identifier): string
    {
        if ($identifier === '' || str_contains($identifier, "\0")) throw new RuntimeException('Unsafe PostgreSQL restore schema name.');
        return '"'.str_replace('"', '""', $identifier).'"';
    }

    private function restoreMySql(array $config, string $path): void
    {
        $binary = (string) config('titan_mcp.backups.mysql_binary', 'mysql');
        $command = [$binary];
        if (!empty($config['host'])) { $command[] = '--host='.(string) $config['host']; }
        if (!empty($config['port'])) { $command[] = '--port='.(string) $config['port']; }
        if (!empty($config['username'])) { $command[] = '--user='.(string) $config['username']; }
        if (!empty($config['charset'])) { $command[] = '--default-character-set='.(string) $config['charset']; }
        $command[] = (string) ($config['database'] ?? '');
        $this->runWithInput($command, ['MYSQL_PWD' => (string) ($config['password'] ?? '')], $path);
    }

    private function restorePostgres(array $config, string $path): void
    {
        $binary = (string) config('titan_mcp.backups.psql_binary', 'psql');
        $command = [$binary, '--set', 'ON_ERROR_STOP=1'];
        if (!empty($config['host'])) { $command[] = '--host='.(string) $config['host']; }
        if (!empty($config['port'])) { $command[] = '--port='.(string) $config['port']; }
        if (!empty($config['username'])) { $command[] = '--username='.(string) $config['username']; }
        $command[] = (string) ($config['database'] ?? '');
        $this->runWithInput($command, ['PGPASSWORD' => (string) ($config['password'] ?? '')], $path);
    }

    /** @param array<string,mixed> $manifest */
    private function restoreSqlite(array $config, string $path, array $manifest): void
    {
        $target = (string) ($config['database'] ?? '');
        if ($target === '' || is_link($target)) {
            throw new RuntimeException('Unable to restore unsafe SQLite database target.');
        }
        $parent = dirname($target);
        if (!is_dir($parent)) {
            throw new RuntimeException('SQLite database parent directory does not exist.');
        }
        $stage = $target.'.titan-mcp-restore-'.bin2hex(random_bytes(6)).'.tmp';
        $tombstone = $target.'.titan-mcp-old-'.bin2hex(random_bytes(6)).'.tmp';
        $activated = false;
        try {
            if (!copy($path, $stage)) {
                throw new RuntimeException('Unable to stage SQLite database restore.');
            }
            $snapshot = $this->fileSnapshot($stage, 'Staged SQLite restore');
            $expectedHash = (string) ($manifest['dump']['sha256'] ?? $manifest['sha256'] ?? '');
            $expectedBytes = (int) ($manifest['dump']['bytes'] ?? $manifest['bytes'] ?? -1);
            if (!hash_equals($expectedHash, $snapshot['sha256']) || $expectedBytes !== $snapshot['bytes']) {
                throw new RuntimeException('Staged SQLite restore failed checksum verification.');
            }
            @chmod($stage, 0600);

            if (is_file($target)) {
                if (!rename($target, $tombstone)) {
                    throw new RuntimeException('Unable to preserve current SQLite database before restore activation.');
                }
            }
            if (!rename($stage, $target)) {
                if (is_file($tombstone)) @rename($tombstone, $target);
                throw new RuntimeException('Unable to atomically activate SQLite database restore.');
            }
            $activated = true;
            @unlink($target.'-wal');
            @unlink($target.'-shm');
            $final = $this->fileSnapshot($target, 'Restored SQLite database');
            if (!hash_equals($expectedHash, $final['sha256']) || $expectedBytes !== $final['bytes']) {
                throw new RuntimeException('SQLite restore post-activation verification failed.');
            }
            if (is_file($tombstone)) @unlink($tombstone);
        } catch (\Throwable $e) {
            if ($activated && is_file($tombstone)) {
                @unlink($target);
                @rename($tombstone, $target);
            }
            throw $e;
        } finally {
            if (is_file($stage) || is_link($stage)) @unlink($stage);
            if (is_file($tombstone) || is_link($tombstone)) @unlink($tombstone);
        }
    }

    private function prepareSqliteForCopy(string $connectionName): void
    {
        try {
            $connection = $this->db->connection($connectionName);
            if (method_exists($connection, 'statement')) {
                $connection->statement('PRAGMA wal_checkpoint(FULL)');
            }
        } catch (\Throwable $e) {
            throw new RuntimeException('Unable to checkpoint SQLite database before backup.', 0, $e);
        }
        $this->disconnect($connectionName);
    }

    private function disconnect(string $connectionName): void
    {
        if (method_exists($this->db, 'disconnect')) {
            $this->db->disconnect($connectionName);
        }
    }

    private function purge(string $connectionName): void
    {
        if (method_exists($this->db, 'purge')) {
            $this->db->purge($connectionName);
        }
    }

    /** @param array<string,mixed> $config */
    private function targetFingerprint(array $config, string $driver): string
    {
        $database = (string) ($config['database'] ?? '');
        if ($driver === 'sqlite') {
            $database = $this->normalizeAbsolutePath($database);
        }
        $identity = [
            'driver' => $driver,
            'host' => (string) ($config['host'] ?? ''),
            'port' => (string) ($config['port'] ?? ''),
            'database' => $database,
            'unix_socket' => (string) ($config['unix_socket'] ?? ''),
        ];
        return hash('sha256', json_encode($identity, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    }

    /** @param array<string,mixed> $config */
    private function databaseLabel(array $config, string $driver): string
    {
        $database = (string) ($config['database'] ?? '');
        return $driver === 'sqlite' ? basename($database) : $database;
    }

    /** @return array{sha256:string,bytes:int} */
    private function fileSnapshot(string $path, string $label): array
    {
        if (!is_file($path) || is_link($path)) {
            throw new RuntimeException("{$label} is missing or unsafe.");
        }
        $bytes = filesize($path);
        $hash = hash_file('sha256', $path);
        if ($bytes === false || $bytes <= 0 || !is_string($hash)) {
            throw new RuntimeException("{$label} is empty or unreadable.");
        }
        return ['sha256' => strtolower($hash), 'bytes' => (int) $bytes];
    }

    private function finalizeDump(string $temp, string $path): void
    {
        $this->fileSnapshot($temp, 'Temporary database dump');
        @chmod($temp, 0600);
        if (!rename($temp, $path)) {
            throw new RuntimeException('Unable to atomically finalize database dump.');
        }
        @chmod($path, 0600);
    }

    /** @return array<string,mixed> */
    private function loadManifest(string $backupId, bool $verifyChecksum): array
    {
        $dir = $this->backupDirectory($backupId, true);
        $path = $dir.DIRECTORY_SEPARATOR.'manifest.json';
        if (!is_file($path) || is_link($path)) {
            throw new RuntimeException("Database backup '{$backupId}' does not contain a safe manifest.");
        }
        $raw = file_get_contents($path);
        if (!is_string($raw) || $raw === '') {
            throw new RuntimeException('Database backup manifest is unreadable or empty.');
        }
        $decoded = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new RuntimeException('Invalid database backup manifest.');
        }
        $schema = (int) ($decoded['schema'] ?? 0);
        if ($verifyChecksum && $schema >= 3) {
            $checksumPath = $dir.DIRECTORY_SEPARATOR.'manifest.sha256';
            if (!is_file($checksumPath) || is_link($checksumPath)) {
                throw new RuntimeException('Database backup manifest checksum is missing or unsafe.');
            }
            $expected = strtolower(trim((string) file_get_contents($checksumPath)));
            if (preg_match('/^[a-f0-9]{64}$/', $expected) !== 1 || !hash_equals($expected, hash('sha256', $raw))) {
                throw new RuntimeException('Database backup manifest checksum mismatch.');
            }
        }
        $this->validateManifestStructure($decoded);
        if (($decoded['backup_id'] ?? null) !== $backupId) {
            throw new RuntimeException('Database backup manifest identifier mismatch.');
        }
        return $decoded;
    }

    /** @param array<string,mixed> $manifest */
    private function validateManifestStructure(array $manifest): void
    {
        $schema = (int) ($manifest['schema'] ?? 0);
        if (!in_array($schema, [2, 3], true)) {
            throw new RuntimeException('Unsupported database backup manifest schema.');
        }
        $connection = (string) ($manifest['connection'] ?? '');
        $driver = strtolower((string) ($manifest['driver'] ?? ''));
        $hash = strtolower((string) ($manifest['dump']['sha256'] ?? $manifest['sha256'] ?? ''));
        $bytes = $manifest['dump']['bytes'] ?? $manifest['bytes'] ?? null;
        if ($connection === '' || preg_match('/^[A-Za-z0-9_.-]+$/', $connection) !== 1) {
            throw new RuntimeException('Invalid database backup connection in manifest.');
        }
        $this->assertSupportedDriver($driver);
        if (preg_match('/^[a-f0-9]{64}$/', $hash) !== 1 || !is_int($bytes) || $bytes <= 0) {
            throw new RuntimeException('Invalid database backup payload metadata.');
        }
        if ($schema >= 3) {
            if (($manifest['integrity']['algorithm'] ?? null) !== 'sha256' || ($manifest['integrity']['manifest_checksum'] ?? null) !== 'manifest.sha256') {
                throw new RuntimeException('Invalid database backup integrity contract.');
            }
            if (preg_match('/^[a-f0-9]{64}$/', strtolower((string) ($manifest['target_fingerprint'] ?? ''))) !== 1) {
                throw new RuntimeException('Invalid database backup target fingerprint.');
            }
            if (($manifest['dump']['file'] ?? null) !== 'database.dump') {
                throw new RuntimeException('Invalid database backup payload filename.');
            }
        }
    }

    private function backupDirectory(string $backupId, bool $mustExist): string
    {
        if (preg_match('/^[A-Za-z0-9_-]+$/', $backupId) !== 1) {
            throw new RuntimeException('Invalid database backup identifier.');
        }
        $this->assertBackupRootSafe(false);
        $path = $this->normalizedBackupRoot.DIRECTORY_SEPARATOR.$backupId;
        if (is_link($path)) {
            throw new RuntimeException('Database backup directory is a symbolic link and is unsafe.');
        }
        if ($mustExist && !is_dir($path)) {
            throw new RuntimeException("Database backup '{$backupId}' does not exist.");
        }
        if (is_dir($path)) {
            $root = realpath($this->normalizedBackupRoot);
            $real = realpath($path);
            if ($root === false || $real === false || !$this->isWithin($real, $root)) {
                throw new RuntimeException('Database backup directory escapes configured storage.');
            }
        }
        return $path;
    }

    private function assertBackupRootSafe(bool $create): void
    {
        $path = str_replace('\\', '/', $this->normalizedBackupRoot);
        if (str_starts_with($path, '/')) {
            $current = '/';
            $relative = ltrim($path, '/');
        } elseif (preg_match('/^[A-Za-z]:\//', $path) === 1) {
            $current = strtoupper(substr($path, 0, 2)).DIRECTORY_SEPARATOR;
            $relative = substr($path, 3);
        } else {
            throw new RuntimeException('Database backup root must be absolute.');
        }

        foreach (array_filter(explode('/', $relative), static fn (string $segment): bool => $segment !== '') as $segment) {
            $current = rtrim($current, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$segment;
            if (is_link($current)) {
                throw new RuntimeException('Database backup root contains a symbolic link component.');
            }
            if (file_exists($current) && !is_dir($current)) {
                throw new RuntimeException('Database backup root contains a non-directory component.');
            }
        }

        if ($create && !is_dir($this->normalizedBackupRoot)) {
            if (!mkdir($this->normalizedBackupRoot, 0700, true) && !is_dir($this->normalizedBackupRoot)) {
                throw new RuntimeException('Unable to create database backup root.');
            }
        }
        if (is_dir($this->normalizedBackupRoot)) {
            @chmod($this->normalizedBackupRoot, 0700);
            if (is_link($this->normalizedBackupRoot)) {
                throw new RuntimeException('Database backup root is a symbolic link.');
            }
            $real = realpath($this->normalizedBackupRoot);
            if ($real === false || !$this->isWithin($real, $this->normalizedBackupRoot) || !$this->isWithin($this->normalizedBackupRoot, $real)) {
                throw new RuntimeException('Database backup root failed canonical safety verification.');
            }
        }
    }

    private function normalizeAbsolutePath(string $path): string
    {
        if ($path === '' || str_contains($path, "\0")) {
            throw new RuntimeException('Database path must be a non-empty absolute path.');
        }
        $path = str_replace('\\', '/', $path);
        $prefix = '';
        if (preg_match('/^[A-Za-z]:\//', $path) === 1) {
            $prefix = strtoupper(substr($path, 0, 2));
            $path = substr($path, 2);
        } elseif (str_starts_with($path, '/')) {
            $prefix = '/';
        } else {
            throw new RuntimeException('Database path must be absolute.');
        }
        $stack = [];
        foreach (explode('/', $path) as $segment) {
            if ($segment === '' || $segment === '.') continue;
            if ($segment === '..') {
                if ($stack === []) throw new RuntimeException('Database path escapes filesystem prefix.');
                array_pop($stack);
                continue;
            }
            $stack[] = $segment;
        }
        $normalized = ($prefix === '/' ? '/' : $prefix.'/').implode('/', $stack);
        return rtrim(str_replace('/', DIRECTORY_SEPARATOR, $normalized), DIRECTORY_SEPARATOR);
    }

    private function isWithin(string $path, string $root): bool
    {
        $path = rtrim(str_replace('\\', '/', $path), '/');
        $root = rtrim(str_replace('\\', '/', $root), '/');
        return $path === $root || str_starts_with($path.'/', $root.'/');
    }

    private function writeAtomic(string $path, string $contents, int $mode): void
    {
        $temp = $path.'.tmp.'.bin2hex(random_bytes(6));
        $handle = @fopen($temp, 'xb');
        if ($handle === false) throw new RuntimeException('Unable to create temporary database backup metadata.');
        try {
            if (!flock($handle, LOCK_EX)) throw new RuntimeException('Unable to lock database backup metadata.');
            $length = strlen($contents);
            $written = 0;
            while ($written < $length) {
                $chunk = fwrite($handle, substr($contents, $written));
                if ($chunk === false || $chunk === 0) throw new RuntimeException('Unable to write complete database backup metadata.');
                $written += $chunk;
            }
            if (!fflush($handle)) throw new RuntimeException('Unable to flush database backup metadata.');
            if (function_exists('fsync') && !@fsync($handle)) throw new RuntimeException('Unable to synchronize database backup metadata.');
            @chmod($temp, $mode & 0777);
        } finally {
            fclose($handle);
        }
        if (!rename($temp, $path)) {
            @unlink($temp);
            throw new RuntimeException('Unable to atomically finalize database backup metadata.');
        }
        @chmod($path, $mode & 0777);
    }

    /** @param list<string> $args @param array<string,string> $env */
    private function run(array $args, array $env): void
    {
        $process = new Process($args, null, $env, null, 900);
        $process->mustRun();
    }

    /** @param list<string> $args @param array<string,string> $env */
    private function runWithInput(array $args, array $env, string $path): void
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) throw new RuntimeException('Unable to open database backup for restore.');
        try {
            $process = new Process($args, null, $env, $handle, 900);
            $process->mustRun();
        } finally {
            fclose($handle);
        }
    }

    private function removeDirectory(string $path): void
    {
        if (!file_exists($path) && !is_link($path)) return;
        if (is_link($path) || is_file($path)) { @unlink($path); return; }
        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS), \RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($it as $item) {
            if ($item->isDir() && !$item->isLink()) @rmdir($item->getPathname()); else @unlink($item->getPathname());
        }
        @rmdir($path);
    }
}
