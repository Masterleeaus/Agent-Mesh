<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;
use RuntimeException;

final class PathGuard
{
    private string $canonicalRoot;

    /** @param list<string> $allowedRoots @param list<string> $denyPatterns */
    public function __construct(
        private readonly string $projectRoot,
        private readonly array $allowedRoots,
        private readonly array $denyPatterns = [],
        private readonly array $allowedRootFiles = [],
    ) {
        $resolved = realpath($projectRoot);
        if ($resolved === false || !is_dir($resolved)) {
            throw new RuntimeException('Titan MCP project root does not exist.');
        }
        $this->canonicalRoot = rtrim($resolved, DIRECTORY_SEPARATOR);
    }


    public function normalizeRelative(string $path): string
    {
        if ($path === '' || str_contains($path, "\0")) {
            throw new InvalidArgumentException('Path must be non-empty and contain no null bytes.');
        }

        if ($path !== trim($path)) {
            throw new InvalidArgumentException('Path cannot have leading or trailing whitespace.');
        }
        $path = str_replace('\\', '/', $path);
        if (preg_match('/^[A-Za-z]:\//', $path)) {
            throw new InvalidArgumentException('Absolute paths are not allowed.');
        }
        $path = ltrim($path, '/');
        if (strlen($path) > 4096 || preg_match('//u', $path) !== 1) {
            throw new InvalidArgumentException('Path is too long or is not valid UTF-8.');
        }
        $segments = array_values(array_filter(
            explode('/', $path),
            static fn (string $segment): bool => $segment !== '' && $segment !== '.'
        ));

        if ($segments === [] || in_array('..', $segments, true)) {
            throw new InvalidArgumentException('Path traversal is not allowed.');
        }
        foreach ($segments as $segment) {
            $this->assertPortableSegment($segment);
        }

        $relative = implode('/', $segments);
        $top = $segments[0];
        $isRootFile = count($segments) === 1 && in_array($relative, $this->allowedRootFiles, true);
        if (!$isRootFile && !in_array($top, $this->allowedRoots, true)) {
            throw new InvalidArgumentException("Path root '{$top}' is not writable through Titan MCP.");
        }

        foreach ($this->denyPatterns as $pattern) {
            if ($this->matchesPattern($pattern, $relative)) {
                throw new InvalidArgumentException("Path '{$relative}' is denied by Titan MCP policy.");
            }
        }

        return $relative;
    }

    public function resolve(string $path): string
    {
        $relative = $this->normalizeRelative($path);
        $this->assertNoSymlinkOrEscape($relative);

        return $this->canonicalRoot.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative);
    }

    public function isDenied(string $relative): bool
    {
        foreach ($this->denyPatterns as $pattern) {
            if ($this->matchesPattern($pattern, $relative)) {
                return true;
            }
        }

        return false;
    }


    private function assertPortableSegment(string $segment): void
    {
        if ($segment === '' || strlen($segment) > 255 || preg_match('/[\x00-\x1F\x7F]/', $segment) === 1) {
            throw new InvalidArgumentException('Path segment is empty, too long, or contains control characters.');
        }
        if (preg_match('/[<>:\"|?*]/', $segment) === 1 || str_ends_with($segment, '.') || str_ends_with($segment, ' ')) {
            throw new InvalidArgumentException("Path segment '{$segment}' is not portable or safe for mutation.");
        }
        if (preg_match('/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i', $segment) === 1) {
            throw new InvalidArgumentException("Reserved device path segment '{$segment}' is not allowed.");
        }
    }

    private function assertNoSymlinkOrEscape(string $relative): void
    {
        $current = $this->canonicalRoot;
        foreach (explode('/', $relative) as $segment) {
            $current .= DIRECTORY_SEPARATOR.$segment;

            if (is_link($current)) {
                throw new InvalidArgumentException("Symbolic links are not accessible through Titan MCP: '{$relative}'.");
            }

            if (file_exists($current)) {
                $real = realpath($current);
                if ($real === false || !$this->isWithinRoot($real)) {
                    throw new InvalidArgumentException("Resolved path escapes the Titan Zero project root: '{$relative}'.");
                }
                if (is_file($current)) {
                    $stat = @lstat($current);
                    if (is_array($stat) && (int) ($stat['nlink'] ?? 1) > 1) {
                        throw new InvalidArgumentException("Hard-linked files are not mutable through Titan MCP: '{$relative}'.");
                    }
                }
            }
        }
    }

    private function isWithinRoot(string $path): bool
    {
        $path = rtrim($path, DIRECTORY_SEPARATOR);
        return $path === $this->canonicalRoot || str_starts_with($path.DIRECTORY_SEPARATOR, $this->canonicalRoot.DIRECTORY_SEPARATOR);
    }

    private function matchesPattern(string $pattern, string $relative): bool
    {
        $relative = ltrim(str_replace('\\', '/', $relative), '/');
        $subtree = null;
        if ($pattern !== '' && str_ends_with($pattern, '/*')) {
            $subtree = rtrim(substr($pattern, 0, -2), '/');
        }

        return fnmatch($pattern, $relative, FNM_PATHNAME)
            || fnmatch($pattern, basename($relative))
            || ($subtree !== null && ($relative === $subtree || str_starts_with($relative, $subtree.'/')));
    }
}
