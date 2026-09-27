<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use DateTimeImmutable;
use DateTimeInterface;
use RuntimeException;

final class BackupRetentionManager
{
    public function __construct(
        private readonly int $retentionDays,
        private readonly int $maxDeletesPerRun = 50,
    ) {}

    /**
     * Delete only stale backups that still pass the owning backup engine's verifier.
     * Invalid/corrupt backups are preserved for forensic/manual recovery.
     *
     * @param callable(string):bool $verifier
     * @return array{enabled:bool,deleted:list<string>,retained:list<string>,skipped_invalid:list<string>,skipped_unsafe:list<string>}
     */
    public function prune(string $backupRoot, callable $verifier, ?DateTimeImmutable $now = null, array $protectedBackupIds = []): array
    {
        $result = ['enabled' => $this->retentionDays > 0, 'deleted' => [], 'retained' => [], 'skipped_invalid' => [], 'skipped_unsafe' => []];
        if ($this->retentionDays <= 0 || !is_dir($backupRoot)) {
            return $result;
        }

        $root = $this->assertSafeRoot($backupRoot);
        $protected = array_values(array_unique(array_filter(array_map('strval', $protectedBackupIds), static fn (string $id): bool => preg_match('/^[A-Za-z0-9_-]+$/', $id) === 1)));
        $cutoff = ($now ?? new DateTimeImmutable('now'))->modify('-'.$this->retentionDays.' days');
        $entries = scandir($root);
        if (!is_array($entries)) {
            throw new RuntimeException('Unable to enumerate Titan MCP backup retention root.');
        }

        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            if (count($result['deleted']) >= max(1, $this->maxDeletesPerRun)) break;
            if (preg_match('/^[A-Za-z0-9_-]+$/', $entry) !== 1) {
                $result['skipped_unsafe'][] = $entry;
                continue;
            }

            $dir = $root.DIRECTORY_SEPARATOR.$entry;
            if (is_link($dir) || !is_dir($dir)) {
                $result['skipped_unsafe'][] = $entry;
                continue;
            }
            $real = realpath($dir);
            if ($real === false || !$this->isWithin($real, $root)) {
                $result['skipped_unsafe'][] = $entry;
                continue;
            }

            if (in_array($entry, $protected, true)) {
                $result['retained'][] = $entry;
                continue;
            }

            $createdAt = $this->manifestCreatedAt($dir, $entry);
            if ($createdAt === null) {
                $result['skipped_invalid'][] = $entry;
                continue;
            }
            if ($createdAt >= $cutoff) {
                $result['retained'][] = $entry;
                continue;
            }

            try {
                $valid = (bool) $verifier($entry);
            } catch (\Throwable) {
                $valid = false;
            }
            if (!$valid) {
                $result['skipped_invalid'][] = $entry;
                continue;
            }

            $this->removeDirectory($real, $root);
            $result['deleted'][] = $entry;
        }

        foreach (['deleted', 'retained', 'skipped_invalid', 'skipped_unsafe'] as $key) {
            sort($result[$key], SORT_STRING);
        }
        return $result;
    }

    private function manifestCreatedAt(string $dir, string $backupId): ?DateTimeImmutable
    {
        $manifestPath = $dir.DIRECTORY_SEPARATOR.'manifest.json';
        $checksumPath = $dir.DIRECTORY_SEPARATOR.'manifest.sha256';
        if (!is_file($manifestPath) || is_link($manifestPath)) return null;
        $raw = file_get_contents($manifestPath);
        if (!is_string($raw) || $raw === '') return null;
        try {
            $manifest = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return null;
        }
        if (!is_array($manifest) || (string) ($manifest['backup_id'] ?? '') !== $backupId) return null;
        if ((int) ($manifest['schema'] ?? 0) >= 3) {
            if (!is_file($checksumPath) || is_link($checksumPath)) return null;
            $expected = strtolower(trim((string) file_get_contents($checksumPath)));
            if (preg_match('/^[a-f0-9]{64}$/', $expected) !== 1 || !hash_equals($expected, hash('sha256', $raw))) return null;
        }
        $created = (string) ($manifest['created_at'] ?? '');
        if ($created === '') return null;
        try {
            $date = new DateTimeImmutable($created);
        } catch (\Throwable) {
            return null;
        }
        return $date;
    }

    private function assertSafeRoot(string $root): string
    {
        $normalized = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $root);
        if (!$this->isAbsolute($normalized)) {
            throw new RuntimeException('Backup retention root must be absolute.');
        }
        $this->assertNoSymlinkComponents($normalized);
        $real = realpath($normalized);
        if ($real === false || !is_dir($real) || is_link($normalized)) {
            throw new RuntimeException('Backup retention root is unsafe or missing.');
        }
        return rtrim($real, DIRECTORY_SEPARATOR);
    }

    private function assertNoSymlinkComponents(string $path): void
    {
        $portable = str_replace('\\', '/', $path);
        if (str_starts_with($portable, '/')) {
            $current = '/';
            $relative = ltrim($portable, '/');
        } elseif (preg_match('/^[A-Za-z]:\//', $portable) === 1) {
            $current = strtoupper(substr($portable, 0, 2)).DIRECTORY_SEPARATOR;
            $relative = substr($portable, 3);
        } else {
            throw new RuntimeException('Backup retention root must be absolute.');
        }
        foreach (array_filter(explode('/', $relative), static fn (string $v): bool => $v !== '') as $segment) {
            $current = rtrim($current, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$segment;
            if (is_link($current)) throw new RuntimeException('Backup retention root contains a symbolic link component.');
            if (file_exists($current) && !is_dir($current)) throw new RuntimeException('Backup retention root contains a non-directory component.');
        }
    }

    private function removeDirectory(string $dir, string $root): void
    {
        if (!$this->isWithin($dir, $root) || $dir === $root || is_link($dir)) {
            throw new RuntimeException('Refusing unsafe backup retention deletion.');
        }
        $it = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($it as $item) {
            $path = $item->getPathname();
            if ($item->isLink() || $item->isFile()) {
                if (!@unlink($path)) throw new RuntimeException('Unable to delete retained backup file safely.');
            } elseif (!@rmdir($path)) {
                throw new RuntimeException('Unable to delete retained backup directory safely.');
            }
        }
        if (!@rmdir($dir)) throw new RuntimeException('Unable to delete stale backup directory safely.');
    }

    private function isWithin(string $path, string $root): bool
    {
        $path = rtrim($path, DIRECTORY_SEPARATOR);
        $root = rtrim($root, DIRECTORY_SEPARATOR);
        return $path !== $root && str_starts_with($path.DIRECTORY_SEPARATOR, $root.DIRECTORY_SEPARATOR);
    }

    private function isAbsolute(string $path): bool
    {
        return str_starts_with($path, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\/]/', $path) === 1;
    }
}
