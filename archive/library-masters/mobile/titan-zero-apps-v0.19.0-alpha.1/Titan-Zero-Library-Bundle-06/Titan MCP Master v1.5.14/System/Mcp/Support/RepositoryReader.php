<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;

final class RepositoryReader
{
    private string $canonicalRoot;

    /** @param list<string> $allowedRoots @param list<string> $allowedRootFiles @param list<string> $denyPatterns */
    public function __construct(
        private readonly string $projectRoot,
        private readonly array $allowedRoots,
        private readonly array $allowedRootFiles,
        private readonly array $denyPatterns,
    ) {
        $resolved = realpath($projectRoot);
        if ($resolved === false || !is_dir($resolved)) {
            throw new RuntimeException('Titan MCP project root does not exist.');
        }
        $this->canonicalRoot = rtrim($resolved, DIRECTORY_SEPARATOR);
    }

    public function read(string $path, int $maxBytes = 200000): array
    {
        [$relative, $absolute] = $this->resolve($path);
        if (!is_file($absolute) || is_link($absolute)) {
            throw new InvalidArgumentException("File '{$relative}' does not exist or is not a regular project file.");
        }
        $size = filesize($absolute);
        if ($size === false || $size > $maxBytes) {
            throw new InvalidArgumentException("File exceeds read limit of {$maxBytes} bytes.");
        }
        $content = file_get_contents($absolute);
        if ($content === false) {
            throw new RuntimeException("Unable to read '{$relative}'.");
        }
        return ['path' => $relative, 'sha256' => hash_file('sha256', $absolute), 'bytes' => $size, 'content' => $content];
    }

    public function list(string $path, int $limit = 500): array
    {
        [$relative, $absolute] = $this->resolve($path);
        if (!is_dir($absolute) || is_link($absolute)) {
            throw new InvalidArgumentException("Directory '{$relative}' does not exist or is not a regular project directory.");
        }

        $items = [];
        foreach (new \DirectoryIterator($absolute) as $item) {
            if ($item->isDot() || $item->isLink()) {
                continue;
            }
            $child = trim($relative.'/'.$item->getFilename(), '/');
            if ($this->isDenied($child)) {
                continue;
            }
            $items[] = [
                'path' => $child,
                'type' => $item->isDir() ? 'directory' : 'file',
                'bytes' => $item->isFile() ? $item->getSize() : null,
            ];
        }

        usort($items, static function (array $a, array $b): int {
            $natural = strnatcasecmp((string) $a['path'], (string) $b['path']);
            return $natural !== 0 ? $natural : strcmp((string) $a['path'], (string) $b['path']);
        });
        $total = count($items);
        $limit = max(1, $limit);

        return [
            'path' => $relative,
            'items' => array_slice($items, 0, $limit),
            'total_visible' => $total,
            'truncated' => $total > $limit,
        ];
    }

    public function search(string $query, array $roots = ['app', 'routes', 'config', 'database', 'resources'], int $limit = 100): array
    {
        $query = trim($query);
        if ($query === '') {
            throw new InvalidArgumentException('Search query cannot be empty.');
        }

        $limit = max(1, $limit);
        $files = [];
        foreach (array_values(array_unique(array_map('strval', $roots))) as $root) {
            [$relativeRoot, $absoluteRoot] = $this->resolve($root);

            if (is_file($absoluteRoot) && !is_link($absoluteRoot)) {
                $size = filesize($absoluteRoot);
                $real = realpath($absoluteRoot);
                if ($size !== false && $size <= 1000000 && $real !== false && $this->isWithinRoot($real)) {
                    $files[$relativeRoot] = ['path' => $real, 'root' => $relativeRoot];
                }
                continue;
            }
            if (!is_dir($absoluteRoot) || is_link($absoluteRoot)) {
                continue;
            }
            $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($absoluteRoot, \FilesystemIterator::SKIP_DOTS));
            foreach ($it as $file) {
                if ($file->isLink() || !$file->isFile() || $file->getSize() > 1000000) {
                    continue;
                }
                $relative = ltrim(str_replace('\\', '/', substr($file->getPathname(), strlen($this->canonicalRoot))), '/');
                if ($this->isDenied($relative)) {
                    continue;
                }
                $real = realpath($file->getPathname());
                if ($real === false || !$this->isWithinRoot($real)) {
                    continue;
                }
                $files[$relative] = ['path' => $real, 'root' => $relativeRoot];
            }
        }

        uksort($files, static function (string $a, string $b): int { $cmp = strnatcasecmp($a, $b); return $cmp !== 0 ? $cmp : strcmp($a, $b); });

        $matches = [];
        $scannedFiles = 0;
        $truncated = false;
        foreach ($files as $relative => $meta) {
            $content = @file_get_contents($meta['path']);
            if ($content === false || str_contains($content, "\0")) {
                continue;
            }
            $scannedFiles++;

            $offset = 0;
            while (($pos = stripos($content, $query, $offset)) !== false) {
                if (count($matches) >= $limit) {
                    $truncated = true;
                    break 2;
                }

                $before = substr($content, 0, $pos);
                $line = substr_count($before, "\n") + 1;
                $lastNewline = strrpos($before, "\n");
                $lineStart = $lastNewline === false ? 0 : $lastNewline + 1;
                $nextNewline = strpos($content, "\n", $pos);
                $lineEnd = $nextNewline === false ? strlen($content) : $nextNewline;
                $lineText = substr($content, $lineStart, $lineEnd - $lineStart);
                $column = $pos - $lineStart + 1;

                if (strlen($lineText) > 500) {
                    $withinLine = max(0, $pos - $lineStart);
                    $excerptStart = max(0, $withinLine - 180);
                    $lineText = substr($lineText, $excerptStart, 500);
                }

                $matches[] = [
                    'path' => $relative,
                    'root' => $meta['root'],
                    'line' => $line,
                    'column' => $column,
                    'sha256' => hash_file('sha256', $meta['path']),
                    'excerpt' => $lineText,
                ];

                $offset = $pos + max(1, strlen($query));
            }
        }

        return [
            'query' => $query,
            'matches' => $matches,
            'match_count' => count($matches),
            'scanned_files' => $scannedFiles,
            'truncated' => $truncated,
        ];
    }

    private function resolve(string $path): array
    {
        if ($path === '' || str_contains($path, "\0")) {
            throw new InvalidArgumentException('Invalid path.');
        }
        $path = str_replace('\\', '/', trim($path));
        if (preg_match('/^[A-Za-z]:\//', $path)) {
            throw new InvalidArgumentException('Absolute paths are not allowed.');
        }
        $path = ltrim($path, '/');
        $segments = array_values(array_filter(explode('/', $path), static fn ($s) => $s !== '' && $s !== '.'));
        if ($segments === [] || in_array('..', $segments, true)) {
            throw new InvalidArgumentException('Path traversal is not allowed.');
        }
        $relative = implode('/', $segments);
        if ($this->isDenied($relative)) {
            throw new InvalidArgumentException("Path '{$relative}' is denied.");
        }
        $top = $segments[0];
        $isRootFile = count($segments) === 1 && in_array($relative, $this->allowedRootFiles, true);
        if (!$isRootFile && !in_array($top, $this->allowedRoots, true)) {
            throw new InvalidArgumentException("Read root '{$top}' is not allowed.");
        }

        $this->assertNoSymlinkOrEscape($relative);
        return [$relative, $this->canonicalRoot.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative)];
    }

    private function assertNoSymlinkOrEscape(string $relative): void
    {
        $current = $this->canonicalRoot;
        foreach (explode('/', $relative) as $segment) {
            $current .= DIRECTORY_SEPARATOR.$segment;
            if (is_link($current)) {
                throw new InvalidArgumentException("Symbolic links are not readable through Titan MCP: '{$relative}'.");
            }
            if (file_exists($current)) {
                $real = realpath($current);
                if ($real === false || !$this->isWithinRoot($real)) {
                    throw new InvalidArgumentException("Resolved path escapes the Titan Zero project root: '{$relative}'.");
                }
            }
        }
    }

    private function isWithinRoot(string $path): bool
    {
        $path = rtrim($path, DIRECTORY_SEPARATOR);
        return $path === $this->canonicalRoot || str_starts_with($path.DIRECTORY_SEPARATOR, $this->canonicalRoot.DIRECTORY_SEPARATOR);
    }

    private function isDenied(string $relative): bool
    {
        foreach ($this->denyPatterns as $pattern) {
            $subtree = str_ends_with($pattern, '/*') ? rtrim(substr($pattern, 0, -2), '/') : null;
            if (fnmatch($pattern, $relative, FNM_PATHNAME)
                || fnmatch($pattern, basename($relative))
                || ($subtree !== null && ($relative === $subtree || str_starts_with($relative, $subtree.'/')))) {
                return true;
            }
        }
        return false;
    }
}
