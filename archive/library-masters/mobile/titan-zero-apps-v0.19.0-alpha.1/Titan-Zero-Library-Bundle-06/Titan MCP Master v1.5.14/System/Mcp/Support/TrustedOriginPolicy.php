<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;
use RuntimeException;

final class TrustedOriginPolicy
{
    /** @var list<string> */
    private array $allowed = [];
    private bool $wildcard = false;

    /** @param list<string> $origins */
    public function __construct(array $origins, private readonly bool $production)
    {
        foreach ($origins as $origin) {
            $origin = trim((string) $origin);
            if ($origin === '') continue;
            if ($origin === '*') {
                if ($production) throw new RuntimeException('Titan MCP wildcard CORS origin is forbidden in production.');
                $this->wildcard = true;
                continue;
            }
            $this->allowed[] = $this->normalize($origin);
        }
        $this->allowed = array_values(array_unique($this->allowed));
        sort($this->allowed, SORT_STRING);
        if ($production && $this->allowed === []) {
            throw new RuntimeException('Titan MCP trusted CORS origins are required in production.');
        }
    }

    public function allows(string $origin): bool
    {
        try { $normalized = $this->normalize($origin); } catch (\Throwable) { return false; }
        return $this->wildcard || in_array($normalized, $this->allowed, true);
    }

    public function responseOrigin(string $origin): string
    {
        if ($origin !== '' && $this->allows($origin)) return $this->normalize($origin);
        return $this->allowed[0] ?? '';
    }

    /** @return list<string> */

    private function normalize(string $origin): string
    {
        $origin = trim($origin);
        if ($origin === '' || preg_match('/[\x00-\x20\x7F]/', $origin) === 1) {
            throw new InvalidArgumentException('Invalid Titan MCP origin.');
        }
        $parts = parse_url($origin);
        if (!is_array($parts)) throw new InvalidArgumentException('Invalid Titan MCP origin.');
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower((string) ($parts['host'] ?? ''));
        if (!in_array($scheme, ['http', 'https', 'chrome-extension'], true) || $host === '') {
            throw new InvalidArgumentException('Titan MCP origins must use http, https, or an explicitly allowlisted chrome-extension origin.');
        }
        if ($scheme === 'chrome-extension' && preg_match('/^[a-p]{32}$/', $host) !== 1) {
            throw new InvalidArgumentException('Chrome extension origins must contain a canonical 32-character extension ID.');
        }
        if (isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) {
            throw new InvalidArgumentException('Titan MCP origins cannot contain userinfo, query or fragment data.');
        }
        $path = (string) ($parts['path'] ?? '');
        if ($path !== '' && $path !== '/') {
            throw new InvalidArgumentException('Titan MCP origins cannot contain a path.');
        }
        if ($scheme === 'chrome-extension' && isset($parts['port'])) throw new InvalidArgumentException('Chrome extension origins cannot contain a port.');
        $port = isset($parts['port']) ? (int) $parts['port'] : null;
        if ($port !== null && ($port < 1 || $port > 65535)) throw new InvalidArgumentException('Invalid Titan MCP origin port.');
        if (($scheme === 'https' && $port === 443) || ($scheme === 'http' && $port === 80)) $port = null;
        $hostOut = str_contains($host, ':') ? '['.$host.']' : $host;
        return $scheme.'://'.$hostOut.($port !== null ? ':'.$port : '');
    }
}
