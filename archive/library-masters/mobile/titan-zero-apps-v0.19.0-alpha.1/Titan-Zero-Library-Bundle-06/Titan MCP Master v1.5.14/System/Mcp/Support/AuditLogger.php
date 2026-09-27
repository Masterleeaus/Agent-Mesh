<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use RuntimeException;

final class AuditLogger
{
    private const ZERO_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
    private const MAX_TAIL_BYTES = 1048576;

    public function __construct(
        private readonly string $logPath,
        private readonly SecretRedactor $redactor,
    ) {}

    /**
     * Mutation preflight. Storage must be safe and any existing chained ledger must
     * still verify before Titan is allowed to perform another write.
     */
    public function assertReady(): void
    {
        $this->assertStorageReady();
        $integrity = $this->verifyIntegrity();
        if (!$integrity['valid']) {
            throw new RuntimeException('Titan MCP audit ledger integrity check failed; writes are blocked until the ledger is recovered. '.implode('; ', $integrity['errors']));
        }
    }

    /** Operational audit storage is infrastructure metadata and is not recursively backed up. */
    public function record(string $event, array $context): void
    {
        $this->assertStorageReady();
        if (preg_match('/^[A-Za-z0-9._:-]{1,128}$/D', $event) !== 1) {
            throw new RuntimeException('Invalid Titan MCP audit event name.');
        }

        $handle = @fopen($this->logPath, 'c+b');
        if (!is_resource($handle)) throw new RuntimeException('Unable to open Titan MCP audit log.');
        try {
            if (!flock($handle, LOCK_EX)) throw new RuntimeException('Unable to lock Titan MCP audit log.');

            // Re-verify while holding the exclusive append lock. This closes the
            // preflight-to-append race between concurrent PHP workers.
            $integrity = $this->verifyHandle($handle);
            if (!$integrity['valid']) {
                throw new RuntimeException('Refusing to append to a tampered Titan MCP audit ledger. '.implode('; ', $integrity['errors']));
            }

            $lastLine = $this->lastLine($handle);
            $previous = $lastLine === null ? self::ZERO_HASH : hash('sha256', $lastLine);
            $entry = [
                'timestamp' => gmdate(DATE_ATOM),
                'event' => $event,
                'context' => $this->redactor->redact($context),
                'previous_sha256' => $previous,
            ];
            $entry['entry_sha256'] = hash('sha256', json_encode($entry, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
            $line = json_encode($entry, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            if (fseek($handle, 0, SEEK_END) !== 0 || fwrite($handle, $line.PHP_EOL) === false || !fflush($handle)) {
                throw new RuntimeException('Unable to append Titan MCP audit event.');
            }
            if (function_exists('fsync') && !fsync($handle)) {
                throw new RuntimeException('Unable to durably sync Titan MCP audit event.');
            }
            @chmod($this->logPath, 0600);
        } finally {
            @flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    /** @return array{valid:bool,entries:int,legacy_entries:int,errors:list<string>} */
    public function verifyIntegrity(): array
    {
        try { $this->assertStorageReady(); } catch (\Throwable $e) {
            return ['valid'=>false,'entries'=>0,'legacy_entries'=>0,'errors'=>[$e->getMessage()]];
        }
        if (!is_file($this->logPath)) return ['valid'=>true,'entries'=>0,'legacy_entries'=>0,'errors'=>[]];
        $handle = @fopen($this->logPath, 'rb');
        if (!is_resource($handle)) return ['valid'=>false,'entries'=>0,'legacy_entries'=>0,'errors'=>['Unable to read Titan MCP audit log.']];
        try {
            if (!flock($handle, LOCK_SH)) {
                return ['valid'=>false,'entries'=>0,'legacy_entries'=>0,'errors'=>['Unable to lock Titan MCP audit log for verification.']];
            }
            return $this->verifyHandle($handle);
        } finally {
            @flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    /** @param resource $handle @return array{valid:bool,entries:int,legacy_entries:int,errors:list<string>} */
    private function verifyHandle($handle): array
    {
        if (rewind($handle) === false) {
            return ['valid'=>false,'entries'=>0,'legacy_entries'=>0,'errors'=>['Unable to rewind Titan MCP audit log.']];
        }
        $previousRawHash = null; $entries = 0; $legacy = 0; $errors = []; $lineNo = 0;
        while (($raw = fgets($handle)) !== false) {
            $lineNo++;
            $raw = rtrim($raw, "\r\n");
            if ($raw === '') continue;
            try { $entry = json_decode($raw, true, flags: JSON_THROW_ON_ERROR); } catch (\Throwable) {
                $errors[] = "Invalid JSON at audit line {$lineNo}"; $previousRawHash = hash('sha256', $raw); continue;
            }
            if (!is_array($entry) || !isset($entry['previous_sha256'], $entry['entry_sha256'])) {
                // Pre-Pass-11 JSONL lines remain readable for upgrade compatibility.
                // Once a chained entry follows them, that chained entry binds to the
                // immediately preceding raw line; new writes never extend an invalid chain.
                $legacy++; $previousRawHash = hash('sha256', $raw); continue;
            }
            $expectedPrevious = $previousRawHash ?? self::ZERO_HASH;
            if (!is_string($entry['previous_sha256']) || !hash_equals($expectedPrevious, strtolower($entry['previous_sha256']))) {
                $errors[] = "Audit chain previous hash mismatch at line {$lineNo}";
            }
            $stored = strtolower((string) $entry['entry_sha256']);
            unset($entry['entry_sha256']);
            try {
                $computed = hash('sha256', json_encode($entry, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
            } catch (\Throwable) {
                $errors[] = "Audit entry encoding failure at line {$lineNo}";
                $computed = '';
            }
            if (preg_match('/^[a-f0-9]{64}$/', $stored) !== 1 || $computed === '' || !hash_equals($stored, $computed)) {
                $errors[] = "Audit entry checksum mismatch at line {$lineNo}";
            }
            $entries++;
            $previousRawHash = hash('sha256', $raw);
        }
        return ['valid'=>$errors===[],'entries'=>$entries,'legacy_entries'=>$legacy,'errors'=>array_values(array_unique($errors))];
    }

    private function assertStorageReady(): void
    {
        if (!$this->isAbsolute($this->logPath)) {
            throw new RuntimeException('Titan MCP audit log path must be absolute.');
        }
        $dir = dirname($this->logPath);
        $this->assertNoSymlinkComponents($dir);
        if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
            throw new RuntimeException('Unable to create Titan MCP audit directory.');
        }
        @chmod($dir, 0700);
        $this->assertNoSymlinkComponents($dir);
        if (is_link($this->logPath) || (file_exists($this->logPath) && !is_file($this->logPath))) {
            throw new RuntimeException('Titan MCP audit log target is unsafe.');
        }
    }

    /** @param resource $handle */
    private function lastLine($handle): ?string
    {
        if (fseek($handle, 0, SEEK_END) !== 0) throw new RuntimeException('Unable to inspect Titan MCP audit log.');
        $size = ftell($handle);
        if (!is_int($size) || $size <= 0) return null;
        $length = min($size, self::MAX_TAIL_BYTES);
        if (fseek($handle, -$length, SEEK_END) !== 0) throw new RuntimeException('Unable to inspect Titan MCP audit tail.');
        $tail = stream_get_contents($handle);
        if (!is_string($tail)) throw new RuntimeException('Unable to read Titan MCP audit tail.');
        $tail = rtrim($tail, "\r\n");
        $pos = strrpos($tail, "\n");
        $line = $pos === false ? $tail : substr($tail, $pos + 1);
        if ($size > self::MAX_TAIL_BYTES && $pos === false) throw new RuntimeException('Titan MCP audit entry exceeds safe tail inspection bound.');
        return $line === '' ? null : rtrim($line, "\r");
    }

    private function assertNoSymlinkComponents(string $path): void
    {
        $path = str_replace('\\', '/', $path);
        if (str_starts_with($path, '/')) { $current='/'; $relative=ltrim($path,'/'); }
        elseif (preg_match('/^[A-Za-z]:\//', $path) === 1) { $current=strtoupper(substr($path,0,2)).DIRECTORY_SEPARATOR; $relative=substr($path,3); }
        else throw new RuntimeException('Titan MCP audit path must be absolute.');
        foreach (array_filter(explode('/', $relative), static fn(string $v): bool => $v !== '') as $segment) {
            $current = rtrim($current, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$segment;
            if (is_link($current)) throw new RuntimeException('Titan MCP audit path contains a symbolic link component.');
            if (file_exists($current) && !is_dir($current)) throw new RuntimeException('Titan MCP audit path contains a non-directory component.');
        }
    }

    private function isAbsolute(string $path): bool
    {
        return str_starts_with($path, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\/]/', $path) === 1;
    }
}
