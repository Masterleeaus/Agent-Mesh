<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;

final class LogInspector
{
    private readonly string $storagePath;
    private readonly string $logRoot;

    public function __construct(
        string $storagePath,
        private readonly SecretRedactor $redactor,
        private readonly int $maxBytes = 1_048_576,
        private readonly int $maxEntryChars = 20_000,
    ) {
        $this->storagePath = rtrim(str_replace('\\', '/', $storagePath), '/');
        $this->logRoot = $this->storagePath.'/logs';
    }

    /**
     * @param array<string, mixed> $loggingConfig
     * @return array<string, mixed>
     */
    public function inspect(array $loggingConfig, int $entryLimit = 150): array
    {
        return $this->inspectResolved($this->resolveConfiguredLog($loggingConfig), $entryLimit);
    }

    /** @param array<string,mixed> $loggingConfig @return array<string,mixed> */
    public function inspectSource(array $loggingConfig, string $source = 'application', int $entryLimit = 150): array
    {
        $source = strtolower(trim($source));
        if ($source !== 'application') {
            throw new InvalidArgumentException('Unsupported Titan MCP log source. Allowed: application.');
        }
        return ['source' => 'application'] + $this->inspect($loggingConfig, $entryLimit);
    }

    /** @param array<string,mixed> $resolved @return array<string,mixed> */
    private function inspectResolved(array $resolved, int $entryLimit): array
    {
        $entryLimit = min(max($entryLimit, 1), 1000);
        if (($resolved['available'] ?? false) !== true) {
            return $this->redactor->redact($resolved + [
                'entries' => [],
                'last_error' => null,
                'count' => 0,
            ]);
        }

        $absolute = (string) $resolved['absolute_path'];
        $scan = $this->scan($absolute);
        $allEntries = $scan['entries'];
        $lastError = null;
        for ($i = count($allEntries) - 1; $i >= 0; $i--) {
            if ($this->isErrorLevel((string) ($allEntries[$i]['level'] ?? ''))) {
                $lastError = $allEntries[$i];
                break;
            }
        }
        $returned = array_values(array_slice($allEntries, -$entryLimit));

        return $this->redactor->redact([
            'available' => true,
            'channel' => $resolved['channel'],
            'driver' => $resolved['driver'],
            'path' => $resolved['path'],
            'entries' => $returned,
            'last_error' => $lastError,
            'count' => count($returned),
            'inspected_entry_count' => count($allEntries),
            'entry_limit' => $entryLimit,
            'bytes_scanned' => $scan['bytes_scanned'],
            'file_size' => $scan['file_size'],
            'truncated_by_bytes' => $scan['truncated_by_bytes'],
            'modified_at' => date(DATE_ATOM, (int) filemtime($absolute)),
        ]);
    }

    /** @param array<string, mixed> $loggingConfig @return array<string, mixed> */
    private function resolveConfiguredLog(array $loggingConfig): array
    {
        $default = trim((string) ($loggingConfig['default'] ?? ''));
        $channels = is_array($loggingConfig['channels'] ?? null) ? $loggingConfig['channels'] : [];
        if ($default === '' || !isset($channels[$default]) || !is_array($channels[$default])) {
            return ['available' => false, 'reason' => 'log_channel_not_configured', 'channel' => $default ?: null, 'driver' => null, 'path' => null];
        }

        $resolved = $this->resolveChannel($default, $channels, 0, []);
        if ($resolved === null) {
            $driver = (string) (($channels[$default]['driver'] ?? null) ?: 'unknown');
            return ['available' => false, 'reason' => 'non_file_log_channel', 'channel' => $default, 'driver' => $driver, 'path' => null];
        }

        $candidate = (string) $resolved['path'];
        if (($resolved['driver'] ?? null) === 'daily') {
            $candidate = $this->resolveDailyPath($candidate);
        }

        $safe = $this->safeLogFile($candidate);
        if ($safe === null) {
            return [
                'available' => false,
                'reason' => is_file($candidate) ? 'unsafe_log_path' : 'log_file_not_found',
                'channel' => $resolved['channel'],
                'driver' => $resolved['driver'],
                'path' => $this->safeRelativeCandidate($candidate),
            ];
        }

        return [
            'available' => true,
            'channel' => $resolved['channel'],
            'driver' => $resolved['driver'],
            'path' => $this->relativeLogPath($safe),
            'absolute_path' => $safe,
        ];
    }

    /**
     * @param array<string, mixed> $channels
     * @param list<string> $seen
     * @return array{channel:string,driver:string,path:string}|null
     */
    private function resolveChannel(string $name, array $channels, int $depth, array $seen): ?array
    {
        if ($depth > 4 || in_array($name, $seen, true)) {
            return null;
        }
        $config = $channels[$name] ?? null;
        if (!is_array($config)) {
            return null;
        }
        $driver = (string) ($config['driver'] ?? 'unknown');
        if (isset($config['path']) && is_string($config['path']) && trim($config['path']) !== '') {
            return ['channel' => $name, 'driver' => $driver, 'path' => $config['path']];
        }
        if ($driver !== 'stack') {
            return null;
        }
        $seen[] = $name;
        foreach ((array) ($config['channels'] ?? []) as $child) {
            $resolved = $this->resolveChannel((string) $child, $channels, $depth + 1, $seen);
            if ($resolved !== null) {
                return $resolved;
            }
        }
        return null;
    }

    private function resolveDailyPath(string $basePath): string
    {
        $info = pathinfo($basePath);
        $directory = $info['dirname'] ?? '.';
        $filename = $info['filename'] ?? basename($basePath);
        $extension = isset($info['extension']) ? '.'.$info['extension'] : '';
        $today = $directory.'/'.$filename.'-'.date('Y-m-d').$extension;
        if (is_file($today)) {
            return $today;
        }

        $pattern = $directory.'/'.$filename.'-*'.$extension;
        $datePattern = '/^'.preg_quote($filename, '/').'-\d{4}-\d{2}-\d{2}'.preg_quote($extension, '/').'$/';
        $matches = array_values(array_filter(glob($pattern) ?: [], static fn (string $file): bool => preg_match($datePattern, basename($file)) === 1));
        rsort($matches, SORT_STRING);
        return $matches[0] ?? $today;
    }

    private function safeLogFile(string $candidate): ?string
    {
        if (!is_file($candidate) || is_link($candidate)) {
            return null;
        }
        $realFile = realpath($candidate);
        $realRoot = realpath($this->logRoot);
        if ($realFile === false || $realRoot === false) {
            return null;
        }
        $file = str_replace('\\', '/', $realFile);
        $root = rtrim(str_replace('\\', '/', $realRoot), '/');
        if ($file !== $root && !str_starts_with($file, $root.'/')) {
            return null;
        }
        return $realFile;
    }

    private function safeRelativeCandidate(string $candidate): ?string
    {
        $candidate = str_replace('\\', '/', $candidate);
        $root = rtrim($this->logRoot, '/');
        if ($candidate === $root || str_starts_with($candidate, $root.'/')) {
            return $this->relativeLogPath($candidate);
        }
        return null;
    }

    private function relativeLogPath(string $absolute): string
    {
        $absolute = str_replace('\\', '/', $absolute);
        if (str_starts_with($absolute, $this->storagePath.'/')) {
            return substr($absolute, strlen($this->storagePath) + 1);
        }
        return 'logs/'.basename($absolute);
    }

    /** @return array{entries:list<array<string,mixed>>,bytes_scanned:int,file_size:int,truncated_by_bytes:bool} */
    private function scan(string $path): array
    {
        $size = filesize($path);
        $fileSize = $size === false ? 0 : (int) $size;
        $byteLimit = max(1, $this->maxBytes);
        $readBytes = min($fileSize, $byteLimit);
        $offset = max(0, $fileSize - $readBytes);
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return ['entries' => [], 'bytes_scanned' => 0, 'file_size' => $fileSize, 'truncated_by_bytes' => false];
        }
        try {
            if ($offset > 0) {
                fseek($handle, $offset);
                fgets($handle); // discard the first potentially partial line
            }
            $content = stream_get_contents($handle) ?: '';
        } finally {
            fclose($handle);
        }

        $rawEntries = $this->splitEntries($content);
        $entries = [];
        foreach ($rawEntries as $entry) {
            $parsed = $this->parseEntry($entry);
            if ($parsed !== null) {
                $entries[] = $parsed;
            }
        }

        return [
            'entries' => $entries,
            'bytes_scanned' => strlen($content),
            'file_size' => $fileSize,
            'truncated_by_bytes' => $offset > 0,
        ];
    }

    /** @return list<string> */
    private function splitEntries(string $content): array
    {
        if (trim($content) === '') {
            return [];
        }
        $lines = preg_split('/\R/', $content) ?: [];
        $firstNonEmpty = null;
        foreach ($lines as $line) {
            if (trim($line) !== '') { $firstNonEmpty = trim($line); break; }
        }
        if ($firstNonEmpty !== null && str_starts_with($firstNonEmpty, '{')) {
            return array_values(array_filter($lines, static function (string $line): bool {
                $line = trim($line);
                if ($line === '' || !str_starts_with($line, '{')) { return false; }
                json_decode($line, true);
                return json_last_error() === JSON_ERROR_NONE;
            }));
        }

        $parts = preg_split('/(?=^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\])/m', $content, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        return array_values(array_filter(array_map('trim', $parts), static fn (string $entry): bool => preg_match('/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/', $entry) === 1));
    }

    /** @return array<string, mixed>|null */
    private function parseEntry(string $entry): ?array
    {
        $entry = trim($entry);
        if ($entry === '') {
            return null;
        }

        $timestamp = null;
        $level = 'UNKNOWN';
        $environment = null;
        if (str_starts_with($entry, '{')) {
            $decoded = json_decode($entry, true);
            if (!is_array($decoded)) {
                return null;
            }
            $timestamp = $decoded['datetime'] ?? $decoded['timestamp'] ?? null;
            $rawLevel = $decoded['level_name'] ?? $decoded['level'] ?? 'UNKNOWN';
            if (is_numeric($rawLevel)) {
                $level = ((int) $rawLevel >= 400) ? 'ERROR' : 'UNKNOWN';
            } else {
                $level = strtoupper((string) $rawLevel);
            }
            $environment = $decoded['channel'] ?? $decoded['environment'] ?? null;
        } elseif (preg_match('/^\[(?<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s+(?<environment>[A-Za-z0-9_-]+)\.(?<level>[A-Z]+):/i', $entry, $m)) {
            $timestamp = $m['timestamp'];
            $environment = $m['environment'];
            $level = strtoupper($m['level']);
        }

        $maxChars = max(256, $this->maxEntryChars);
        $truncated = strlen($entry) > $maxChars;
        if ($truncated) {
            $entry = substr($entry, 0, $maxChars).' ... [TRUNCATED]';
        }

        return [
            'timestamp' => $timestamp,
            'environment' => $environment,
            'level' => $level,
            'text' => $entry,
            'truncated' => $truncated,
        ];
    }

    private function isErrorLevel(string $level): bool
    {
        return in_array(strtoupper($level), ['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'], true);
    }
}
