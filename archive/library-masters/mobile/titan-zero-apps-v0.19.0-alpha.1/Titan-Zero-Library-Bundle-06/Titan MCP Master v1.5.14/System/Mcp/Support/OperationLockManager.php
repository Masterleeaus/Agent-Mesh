<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use RuntimeException;

/**
 * Conservative host-wide serialization for Titan MCP mutations.
 *
 * The lock is intentionally global: backup creation, mutation, verification,
 * auditing and any automatic recovery execute as one critical section. Reads
 * remain concurrent. flock() releases automatically if a worker crashes.
 */
final class OperationLockManager
{
    public function __construct(
        private readonly string $lockRoot,
        private readonly float $timeoutSeconds = 10.0,
    ) {}

    public function withMutationLock(callable $callback): mixed
    {
        $this->assertRootReady();
        $path = rtrim($this->lockRoot, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'mutation.lock';
        if (is_link($path) || (file_exists($path) && !is_file($path))) {
            throw new RuntimeException('Titan MCP mutation lock target is unsafe.');
        }
        $handle = @fopen($path, 'c+b');
        if (!is_resource($handle)) {
            throw new RuntimeException('Unable to open Titan MCP mutation lock.');
        }
        @chmod($path, 0600);

        $deadline = microtime(true) + max(0.01, $this->timeoutSeconds);
        $locked = false;
        try {
            do {
                if (@flock($handle, LOCK_EX | LOCK_NB)) {
                    $locked = true;
                    break;
                }
                usleep(20000);
            } while (microtime(true) < $deadline);

            if (!$locked) {
                throw new RuntimeException('Titan MCP mutation lock timed out; no write was attempted.');
            }

            return $callback();
        } finally {
            if ($locked) @flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    private function assertRootReady(): void
    {
        if (!$this->isAbsolute($this->lockRoot)) {
            throw new RuntimeException('Titan MCP mutation lock root must be absolute.');
        }
        $this->assertNoSymlinkComponents($this->lockRoot);
        if (!is_dir($this->lockRoot) && !mkdir($this->lockRoot, 0700, true) && !is_dir($this->lockRoot)) {
            throw new RuntimeException('Unable to create Titan MCP mutation lock directory.');
        }
        @chmod($this->lockRoot, 0700);
        $this->assertNoSymlinkComponents($this->lockRoot);
        if (is_link($this->lockRoot) || !is_dir($this->lockRoot)) {
            throw new RuntimeException('Titan MCP mutation lock directory is unsafe.');
        }
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
            throw new RuntimeException('Titan MCP mutation lock root must be absolute.');
        }

        foreach (array_filter(explode('/', $relative), static fn (string $v): bool => $v !== '') as $segment) {
            $current = rtrim($current, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$segment;
            if (is_link($current)) {
                throw new RuntimeException('Titan MCP mutation lock path contains a symbolic link component.');
            }
            if (file_exists($current) && !is_dir($current)) {
                throw new RuntimeException('Titan MCP mutation lock path contains a non-directory component.');
            }
        }
    }

    private function isAbsolute(string $path): bool
    {
        return str_starts_with($path, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\/]/', $path) === 1;
    }
}
