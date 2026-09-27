<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

final class RuntimeDiagnostics
{
    public function __construct(
        private readonly string $basePath,
        private readonly SecretRedactor $redactor,
    ) {}

    /** @return array<string, mixed> */
    public function versions(string $runtimeLaravelVersion): array
    {
        $lock = $this->readJson($this->basePath.'/composer.lock');
        $extension = $this->readJson($this->basePath.'/app/Extensions/TitanMcp/extension.manifest.json');
        $lockedLaravel = $this->packageVersion($lock, 'laravel/framework');
        $runtimeLaravelVersion = ltrim(trim($runtimeLaravelVersion), 'v');
        $lockPath = $this->basePath.'/composer.lock';

        return $this->redactor->redact([
            'php' => [
                'runtime' => PHP_VERSION,
                'major_minor' => PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION,
                'sapi' => PHP_SAPI,
                'meets_extension_minimum' => version_compare(PHP_VERSION, '8.3.0', '>='),
            ],
            'laravel' => [
                'runtime' => $runtimeLaravelVersion !== '' ? $runtimeLaravelVersion : null,
                'locked' => $lockedLaravel,
                'runtime_matches_lock' => $runtimeLaravelVersion !== '' && $lockedLaravel !== null
                    ? version_compare($runtimeLaravelVersion, $lockedLaravel, '==')
                    : null,
            ],
            'titan_mcp_extension' => [
                'version' => isset($extension['version']) ? (string) $extension['version'] : (string) config('titan_mcp.server.version', '1.5.14'),
                'manifest_schema' => isset($extension['schema_version']) ? (string) $extension['schema_version'] : null,
                'transport' => 'extension-owned-streamable-http-json-rpc',
                'php_mcp_package_required' => false,
            ],
            'composer_lock_sha256' => is_file($lockPath) ? hash_file('sha256', $lockPath) : null,
        ]);
    }

    /**
     * @param list<array<string, mixed>> $routes
     * @return array<string, mixed>
     */
    public function routes(array $routes, string $query = '', int $limit = 200, int $maxLimit = 1000): array
    {
        $query = trim($query);
        $maxLimit = max(1, $maxLimit);
        $limit = min(max($limit, 1), $maxLimit);

        $matches = array_values(array_filter($routes, static function (array $route) use ($query): bool {
            if ($query === '') {
                return true;
            }
            $encoded = json_encode($route, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            return is_string($encoded) && stripos($encoded, $query) !== false;
        }));

        usort($matches, static function (array $a, array $b): int {
            foreach (['uri', 'name', 'action'] as $key) {
                $left = (string) ($a[$key] ?? '');
                $right = (string) ($b[$key] ?? '');
                $cmp = strnatcasecmp($left, $right);
                if ($cmp !== 0) {
                    return $cmp;
                }
                $cmp = strcmp($left, $right);
                if ($cmp !== 0) {
                    return $cmp;
                }
            }
            return strcmp(
                implode(',', array_map('strval', (array) ($a['methods'] ?? []))),
                implode(',', array_map('strval', (array) ($b['methods'] ?? []))),
            );
        });

        $methodCounts = [];
        foreach ($matches as $route) {
            foreach ((array) ($route['methods'] ?? []) as $method) {
                $method = strtoupper((string) $method);
                if ($method === '') {
                    continue;
                }
                $methodCounts[$method] = ($methodCounts[$method] ?? 0) + 1;
            }
        }
        ksort($methodCounts, SORT_NATURAL | SORT_FLAG_CASE);

        $total = count($matches);
        $returned = array_slice($matches, 0, $limit);

        return $this->redactor->redact([
            'query' => $query,
            'routes' => $returned,
            'returned' => count($returned),
            'count' => count($returned), // backwards-compatible field
            'total_matches' => $total,
            'truncated' => $total > count($returned),
            'limit' => $limit,
            'method_counts' => $methodCounts,
        ]);
    }


    /**
     * @param list<string> $binaries
     * @param list<string> $paths
     * @return array<string,mixed>
     */
    public function recoveryReadiness(array $binaries = [], array $paths = []): array
    {
        $binaryChecks = [];
        foreach (array_values(array_unique(array_filter(array_map('strval', $binaries)))) as $binary) {
            $binaryChecks[$binary] = $this->binaryAvailable($binary);
        }
        $pathChecks = [];
        foreach (array_values(array_unique(array_filter(array_map('strval', $paths)))) as $path) {
            $pathChecks[$path] = $this->pathReady($path);
        }
        return ['binaries'=>$binaryChecks,'paths'=>$pathChecks,'ready'=>!in_array(false,$binaryChecks,true) && !in_array(false,$pathChecks,true)];
    }

    private function binaryAvailable(string $binary): bool
    {
        $binary = trim($binary);
        if ($binary === '') return false;
        if (str_contains($binary, '/') || str_contains($binary, '\\')) return is_file($binary) && is_executable($binary);
        $extensions = DIRECTORY_SEPARATOR === '\\' ? array_merge([''], array_filter(explode(';', (string) getenv('PATHEXT')))) : [''];
        foreach (explode(PATH_SEPARATOR, (string) getenv('PATH')) as $directory) {
            if ($directory === '') continue;
            foreach ($extensions as $extension) {
                $candidate = rtrim($directory, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$binary.$extension;
                if (is_file($candidate) && is_executable($candidate)) return true;
            }
        }
        return false;
    }

    private function pathReady(string $path): bool
    {
        if ($path === '') return false;
        if (is_link($path)) return false;
        if (is_dir($path)) return is_writable($path);
        $parent = dirname($path);
        while ($parent !== dirname($parent) && !file_exists($parent)) $parent = dirname($parent);
        return is_dir($parent) && !is_link($parent) && is_writable($parent);
    }

    /** @return array<string, mixed> */
    private function readJson(string $path): array
    {
        if (!is_file($path) || is_link($path)) {
            return [];
        }
        try {
            $decoded = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return [];
        }
        return is_array($decoded) ? $decoded : [];
    }

    /** @param array<string, mixed> $lock */
    private function packageVersion(array $lock, string $packageName): ?string
    {
        foreach (array_merge((array) ($lock['packages'] ?? []), (array) ($lock['packages-dev'] ?? [])) as $package) {
            if (!is_array($package) || ($package['name'] ?? null) !== $packageName) {
                continue;
            }
            $version = trim((string) ($package['version'] ?? ''));
            return $version !== '' ? ltrim($version, 'v') : null;
        }
        return null;
    }
}
