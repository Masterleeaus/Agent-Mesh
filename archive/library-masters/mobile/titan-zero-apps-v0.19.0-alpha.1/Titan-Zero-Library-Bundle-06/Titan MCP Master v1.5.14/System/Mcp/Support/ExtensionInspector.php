<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;

final class ExtensionInspector
{
    private string $canonicalRoot;
    private string $extensionsRoot;

    public function __construct(string $projectRoot)
    {
        $resolved = realpath($projectRoot);
        if ($resolved === false || !is_dir($resolved)) {
            throw new RuntimeException('Titan MCP project root does not exist.');
        }

        $this->canonicalRoot = rtrim($resolved, DIRECTORY_SEPARATOR);
        $this->extensionsRoot = $this->canonicalRoot.DIRECTORY_SEPARATOR.'app'.DIRECTORY_SEPARATOR.'Extensions';
    }

    public function summary(): array
    {
        if (!is_dir($this->extensionsRoot)) {
            return [
                'path' => 'app/Extensions',
                'top_level_entries' => 0,
                'extension_directories' => 0,
                'artifacts_count' => 0,
                'artifacts' => [],
                'case_collisions' => [],
            ];
        }

        $entries = [];
        foreach (new \DirectoryIterator($this->extensionsRoot) as $item) {
            if ($item->isDot()) {
                continue;
            }
            $entries[] = [
                'name' => $item->getFilename(),
                'is_dir' => $item->isDir(),
                'is_file' => $item->isFile(),
                'is_link' => $item->isLink(),
                'bytes' => $item->isFile() && !$item->isLink() ? $item->getSize() : null,
            ];
        }

        usort($entries, static fn (array $a, array $b): int => strnatcasecmp((string) $a['name'], (string) $b['name']));

        $directoryCount = 0;
        $directoryNames = [];
        $artifacts = [];
        foreach ($entries as $item) {
            if ($item['is_dir'] && !$item['is_link']) {
                $directoryCount++;
                $directoryNames[] = (string) $item['name'];
                continue;
            }

            $artifacts[] = [
                'name' => $item['name'],
                'path' => 'app/Extensions/'.$item['name'],
                'type' => $item['is_link'] ? 'symlink' : ($item['is_file'] ? 'file' : 'other'),
                'bytes' => $item['bytes'],
                'hidden' => str_starts_with((string) $item['name'], '.'),
            ];
        }

        $caseMap = [];
        foreach ($directoryNames as $directoryName) {
            $caseMap[strtolower($directoryName)][] = $directoryName;
        }
        $caseCollisions = [];
        foreach ($caseMap as $key => $names) {
            if (count($names) < 2) {
                continue;
            }
            sort($names, SORT_STRING);
            $caseCollisions[$key] = $names;
        }
        ksort($caseCollisions, SORT_NATURAL | SORT_FLAG_CASE);

        return [
            'path' => 'app/Extensions',
            'top_level_entries' => count($entries),
            'extension_directories' => $directoryCount,
            'artifacts_count' => count($artifacts),
            'artifacts' => $artifacts,
            'case_collisions' => $caseCollisions,
        ];
    }

    public function list(): array
    {
        $summary = $this->summary();
        if (!is_dir($this->extensionsRoot)) {
            return ['extensions' => [], 'count' => 0, 'summary' => $summary];
        }

        $extensions = [];
        foreach (new \DirectoryIterator($this->extensionsRoot) as $item) {
            if ($item->isDot() || !$item->isDir() || $item->isLink()) {
                continue;
            }

            $path = $item->getPathname();
            $scan = $this->scanExtension($item->getFilename(), $path, false);
            $extensions[] = [
                'name' => $item->getFilename(),
                'path' => 'app/Extensions/'.$item->getFilename(),
                'identity' => $scan['identity'],
                'manifest_files' => $scan['manifest_files'],
                'inventory' => $scan['inventory'],
                'architecture_counts' => array_map(
                    static fn (array $bucket): int => (int) $bucket['count'],
                    $scan['architecture']
                ),
            ];
        }

        usort($extensions, static function (array $a, array $b): int {
            $natural = strnatcasecmp((string) $a['name'], (string) $b['name']);
            return $natural !== 0 ? $natural : strcmp((string) $a['name'], (string) $b['name']);
        });

        $aggregateInventory = [];
        $aggregateArchitecture = [];
        foreach ($extensions as $extension) {
            foreach ($extension['inventory'] as $key => $value) {
                $aggregateInventory[$key] = ($aggregateInventory[$key] ?? 0) + (int) $value;
            }
            foreach ($extension['architecture_counts'] as $key => $value) {
                $aggregateArchitecture[$key] = ($aggregateArchitecture[$key] ?? 0) + (int) $value;
            }
        }
        ksort($aggregateInventory);
        ksort($aggregateArchitecture);

        return [
            'extensions' => $extensions,
            'count' => count($extensions),
            'summary' => $summary,
            'aggregate_inventory' => $aggregateInventory,
            'aggregate_architecture_counts' => $aggregateArchitecture,
        ];
    }

    public function inspect(string $name): array
    {
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $name)) {
            throw new InvalidArgumentException('Invalid extension name.');
        }

        $path = $this->extensionsRoot.DIRECTORY_SEPARATOR.$name;
        if (!is_dir($path) || is_link($path)) {
            throw new InvalidArgumentException("Extension '{$name}' does not exist.");
        }

        $real = realpath($path);
        if ($real === false || !$this->isWithinExtensionsRoot($real)) {
            throw new InvalidArgumentException("Extension '{$name}' resolves outside app/Extensions.");
        }

        return $this->scanExtension($name, $real, true);
    }

    private function scanExtension(string $name, string $path, bool $includePaths): array
    {
        $manifestFiles = $this->manifestFiles($path);
        $identity = $this->identity($name, $path);
        $architecture = $this->emptyArchitecture();
        $inventory = [
            'total_files' => 0,
            'php_files' => 0,
            'json_files' => 0,
            'route_files' => 0,
            'migrations' => 0,
            'tests' => 0,
        ];

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isLink() || !$file->isFile()) {
                continue;
            }

            $real = realpath($file->getPathname());
            if ($real === false || !$this->isWithinExtensionsRoot($real)) {
                continue;
            }

            $relativeInside = ltrim(str_replace('\\', '/', substr($real, strlen(rtrim($path, DIRECTORY_SEPARATOR)))), '/');
            $projectRelative = 'app/Extensions/'.$name.'/'.$relativeInside;
            $extension = strtolower($file->getExtension());

            $inventory['total_files']++;
            if ($extension === 'php') {
                $inventory['php_files']++;
            }
            if ($extension === 'json') {
                $inventory['json_files']++;
            }

            $categories = $this->categoriesFor($relativeInside, $file->getFilename(), $extension);
            foreach ($categories as $category) {
                $architecture[$category]['count']++;
                if ($includePaths && count($architecture[$category]['paths']) < 100) {
                    $architecture[$category]['paths'][] = $projectRelative;
                }
            }

            if (in_array('routes', $categories, true)) {
                $inventory['route_files']++;
            }
            if (in_array('migrations', $categories, true)) {
                $inventory['migrations']++;
            }
            if (in_array('tests', $categories, true)) {
                $inventory['tests']++;
            }
        }

        foreach ($architecture as &$bucket) {
            sort($bucket['paths'], SORT_NATURAL | SORT_FLAG_CASE);
            $bucket['truncated'] = $includePaths && $bucket['count'] > count($bucket['paths']);
        }
        unset($bucket);

        $topLevelFiles = [];
        foreach (new \DirectoryIterator($path) as $item) {
            if ($item->isDot() || !$item->isFile() || $item->isLink()) {
                continue;
            }
            $topLevelFiles[] = $item->getFilename();
        }
        sort($topLevelFiles, SORT_NATURAL | SORT_FLAG_CASE);

        return [
            'name' => $name,
            'path' => 'app/Extensions/'.$name,
            'identity' => $identity,
            'manifest_files' => $manifestFiles,
            'inventory' => $inventory,
            'architecture' => $architecture,
            'top_level_files' => $includePaths ? array_slice($topLevelFiles, 0, 200) : [],
            'top_level_files_truncated' => $includePaths && count($topLevelFiles) > 200,
        ];
    }

    private function identity(string $folder, string $path): array
    {
        $extension = $this->readJson($path.'/extension.json');
        $composer = $this->readJson($path.'/composer.json');

        return [
            'folder' => $folder,
            'slug' => $this->scalarOrNull($extension['slug'] ?? null),
            'name' => $this->scalarOrNull($extension['name'] ?? ($composer['name'] ?? null)),
            'version' => $this->scalarOrNull($extension['version'] ?? ($composer['version'] ?? null)),
            'provider' => $this->scalarOrNull($extension['provider'] ?? null),
            'description' => $this->scalarOrNull($extension['description'] ?? ($composer['description'] ?? null)),
            'tenant_boundary' => $this->scalarOrNull($extension['tenant_boundary'] ?? null),
            'dependencies' => $this->stringList($extension['dependencies'] ?? []),
            'optional_dependencies' => $this->stringList($extension['optional_dependencies'] ?? []),
            'schema' => $this->scalarOrNull($extension['schema'] ?? null),
        ];
    }

    private function manifestFiles(string $path): array
    {
        $candidates = [
            'extension.json',
            'extension.manifest.json',
            'module.json',
            'composer.json',
            'package.json',
            'FILE-SHA256.json',
            'PACKAGE-FILES.sha256',
            'MERGE_MANIFEST.json',
            'SOURCE-PROVENANCE.json',
        ];

        $found = [];
        foreach ($candidates as $candidate) {
            if (is_file($path.'/'.$candidate) && !is_link($path.'/'.$candidate)) {
                $found[] = $candidate;
            }
        }
        return $found;
    }

    private function categoriesFor(string $relative, string $filename, string $extension): array
    {
        $relative = str_replace('\\', '/', $relative);
        $categories = [];

        if ($extension === 'php' && str_ends_with($filename, 'ServiceProvider.php')) {
            $categories[] = 'service_providers';
        }
        if ($extension === 'php' && preg_match('~(^|/)Controllers?/~i', $relative)) {
            $categories[] = 'controllers';
        }
        if ($extension === 'php' && preg_match('~(^|/)Models?/~i', $relative)) {
            $categories[] = 'models';
        }
        if ($extension === 'php' && preg_match('~(^|/)Services?/~i', $relative)) {
            $categories[] = 'services';
        }
        if ($extension === 'php' && preg_match('~(^|/)Commands?/~i', $relative)) {
            $categories[] = 'commands';
        }
        if ($extension === 'php' && preg_match('~(^|/)Events?/~i', $relative)) {
            $categories[] = 'events';
        }
        if ($extension === 'php' && preg_match('~(^|/)Listeners?/~i', $relative)) {
            $categories[] = 'listeners';
        }
        if ($extension === 'php' && preg_match('~(^|/)Jobs?/~i', $relative)) {
            $categories[] = 'jobs';
        }
        if ($extension === 'php' && preg_match('~(^|/)Policies?/~i', $relative)) {
            $categories[] = 'policies';
        }
        if ($extension === 'php' && preg_match('~(^|/)Middleware/~i', $relative)) {
            $categories[] = 'middleware';
        }
        if ($extension === 'php' && preg_match('~(^|/)config/.*\.php$~i', $relative)) {
            $categories[] = 'config';
        }
        if ($extension === 'php' && preg_match('~(^|/)routes/.*\.php$~i', $relative)) {
            $categories[] = 'routes';
        }
        if ($extension === 'php' && preg_match('~(^|/)database/migrations/.*\.php$~i', $relative)) {
            $categories[] = 'migrations';
        }
        if (preg_match('~(^|/)(tests?|specs?)/~i', $relative)) {
            $categories[] = 'tests';
        }
        if (preg_match('~(^|/)(Agents?|AIWorkforce|Workforce)(/|$)~i', $relative)
            && in_array($extension, ['php', 'json', 'yaml', 'yml', 'md'], true)) {
            $categories[] = 'agents';
        }

        return array_values(array_unique($categories));
    }

    private function emptyArchitecture(): array
    {
        $keys = [
            'service_providers', 'controllers', 'models', 'services', 'commands',
            'events', 'listeners', 'jobs', 'policies', 'middleware', 'config',
            'routes', 'migrations', 'tests', 'agents',
        ];

        $result = [];
        foreach ($keys as $key) {
            $result[$key] = ['count' => 0, 'paths' => [], 'truncated' => false];
        }
        return $result;
    }

    private function readJson(string $path): array
    {
        if (!is_file($path) || is_link($path)) {
            return [];
        }
        $raw = file_get_contents($path);
        if ($raw === false) {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function scalarOrNull(mixed $value): string|int|float|bool|null
    {
        return is_scalar($value) ? $value : null;
    }

    private function stringList(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }
        $out = [];
        foreach ($value as $item) {
            if (is_scalar($item)) {
                $out[] = (string) $item;
            }
        }
        return array_values(array_unique($out));
    }

    private function isWithinExtensionsRoot(string $path): bool
    {
        $root = rtrim($this->extensionsRoot, DIRECTORY_SEPARATOR);
        $path = rtrim($path, DIRECTORY_SEPARATOR);
        return $path === $root || str_starts_with($path.DIRECTORY_SEPARATOR, $root.DIRECTORY_SEPARATOR);
    }
}
