<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

final class ApplicationContextInspector
{
    public function __construct(
        private readonly string $basePath,
        private readonly SecretRedactor $redactor,
        private readonly int $maxPackages = 250,
    ) {}

    /**
     * @param list<string> $configuredConnections
     * @return array<string,mixed>
     */
    public function inspect(
        string $appName,
        string $environment,
        string $laravelVersion,
        string $applicationUrl,
        string $defaultDatabase,
        array $configuredConnections,
        string $mcpRoutePrefix,
    ): array {
        $connections = array_values(array_unique(array_filter(array_map(
            static fn ($name): string => trim((string) $name),
            $configuredConnections,
        ), static fn (string $name): bool => $name !== '')));
        usort($connections, static function (string $a, string $b): int {
            $cmp = strnatcasecmp($a, $b);
            return $cmp !== 0 ? $cmp : strcmp($a, $b);
        });

        $canonicalUrl = $this->canonicalUrl($applicationUrl);
        $routePrefix = trim($mcpRoutePrefix, '/');
        $mcpUrl = $canonicalUrl;
        if ($canonicalUrl !== null && $routePrefix !== '') {
            $mcpUrl = rtrim($canonicalUrl, '/').'/'.$routePrefix;
        }

        return $this->redactor->redact([
            'application' => [
                'name' => $appName,
                'environment' => $environment,
                'php' => PHP_VERSION,
                'laravel' => ltrim(trim($laravelVersion), 'v'),
                'url' => $canonicalUrl,
                'mcp_url' => $mcpUrl,
            ],
            'database' => [
                'default_connection' => trim($defaultDatabase) !== '' ? trim($defaultDatabase) : null,
                'connections' => $connections,
                'connection_count' => count($connections),
            ],
            'composer' => $this->composerInventory(),
            'frontend' => $this->frontendInventory(),
        ]);
    }

    /** @return array<string,mixed> */
    private function composerInventory(): array
    {
        $composer = $this->readJson($this->basePath.'/composer.json');
        $lock = $this->readJson($this->basePath.'/composer.lock');
        $locked = [];
        foreach (array_merge((array) ($lock['packages'] ?? []), (array) ($lock['packages-dev'] ?? [])) as $package) {
            if (!is_array($package)) continue;
            $name = trim((string) ($package['name'] ?? ''));
            if ($name === '') continue;
            $version = trim((string) ($package['version'] ?? ''));
            $locked[$name] = $version !== '' ? ltrim($version, 'v') : null;
        }

        $rows = [];
        foreach ([['key' => 'require', 'scope' => 'prod'], ['key' => 'require-dev', 'scope' => 'dev']] as $spec) {
            foreach ((array) ($composer[$spec['key']] ?? []) as $name => $constraint) {
                $name = (string) $name;
                if ($name === '' || $name === 'php' || str_starts_with($name, 'ext-')) continue;
                $rows[] = [
                    'name' => $name,
                    'scope' => $spec['scope'],
                    'constraint' => is_scalar($constraint) ? (string) $constraint : null,
                    'locked' => $locked[$name] ?? null,
                ];
            }
        }
        $this->sortPackages($rows);
        $total = count($rows);
        $limit = max(1, $this->maxPackages);
        $rows = array_slice($rows, 0, $limit);

        return [
            'direct_count' => $total,
            'returned' => count($rows),
            'truncated' => $total > count($rows),
            'packages' => $rows,
        ];
    }

    /** @return array<string,mixed> */
    private function frontendInventory(): array
    {
        $package = $this->readJson($this->basePath.'/package.json');
        $lock = $this->readJson($this->basePath.'/package-lock.json');
        $lockedPackages = is_array($lock['packages'] ?? null) ? $lock['packages'] : [];
        $rows = [];
        foreach ([['key' => 'dependencies', 'scope' => 'prod'], ['key' => 'devDependencies', 'scope' => 'dev']] as $spec) {
            foreach ((array) ($package[$spec['key']] ?? []) as $name => $constraint) {
                $name = (string) $name;
                if ($name === '') continue;
                $locked = $lockedPackages['node_modules/'.$name]['version'] ?? null;
                $rows[] = [
                    'name' => $name,
                    'scope' => $spec['scope'],
                    'constraint' => is_scalar($constraint) ? (string) $constraint : null,
                    'locked' => is_scalar($locked) ? ltrim((string) $locked, 'v') : null,
                ];
            }
        }
        $this->sortPackages($rows);
        $total = count($rows);
        $limit = max(1, $this->maxPackages);
        $rows = array_slice($rows, 0, $limit);

        return [
            'direct_count' => $total,
            'returned' => count($rows),
            'truncated' => $total > count($rows),
            'packages' => $rows,
        ];
    }

    /** @param list<array<string,mixed>> $rows */
    private function sortPackages(array &$rows): void
    {
        usort($rows, static function (array $a, array $b): int {
            $left = (string) ($a['name'] ?? '');
            $right = (string) ($b['name'] ?? '');
            $cmp = strnatcasecmp($left, $right);
            return $cmp !== 0 ? $cmp : strcmp($left, $right);
        });
    }

    /** @return array<string,mixed> */
    private function readJson(string $path): array
    {
        if (!is_file($path) || is_link($path)) return [];
        try {
            $decoded = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return [];
        }
        return is_array($decoded) ? $decoded : [];
    }

    private function canonicalUrl(string $value): ?string
    {
        $value = trim($value);
        if ($value === '') return null;
        $parts = parse_url($value);
        if (!is_array($parts)) return null;
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = (string) ($parts['host'] ?? '');
        if (!in_array($scheme, ['http', 'https'], true) || $host === '') return null;
        $port = isset($parts['port']) ? ':'.(int) $parts['port'] : '';
        $path = (string) ($parts['path'] ?? '');
        if ($path === '/') $path = '';
        return $scheme.'://'.$host.$port.$path;
    }
}
