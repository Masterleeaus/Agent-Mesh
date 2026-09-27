<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use RuntimeException;

final class McpRoutePrefixPolicy
{
    public function normalize(string $prefix): string
    {
        if ($prefix === '' || str_contains($prefix, "\0") || preg_match('/[\x00-\x1F\x7F]/', $prefix) === 1) {
            throw new RuntimeException('Titan MCP route prefix is empty or contains control characters.');
        }
        if (strlen($prefix) > 160 || preg_match('//u', $prefix) !== 1) {
            throw new RuntimeException('Titan MCP route prefix is too long or is not valid UTF-8.');
        }
        $prefix = trim($prefix, '/');
        if ($prefix === '' || str_contains($prefix, '\\') || str_contains($prefix, '//')) {
            throw new RuntimeException('Titan MCP route prefix is unsafe.');
        }
        $segments = explode('/', $prefix);
        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..' || preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/D', $segment) !== 1) {
                throw new RuntimeException("Titan MCP route segment '{$segment}' is unsafe.");
            }
        }
        return implode('/', $segments);
    }
}
