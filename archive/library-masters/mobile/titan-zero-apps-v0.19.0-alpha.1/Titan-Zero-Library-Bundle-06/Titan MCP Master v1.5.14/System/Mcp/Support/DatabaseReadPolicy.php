<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;

final class DatabaseReadPolicy
{
    /** @param list<string> $allowedConnections @param list<string> $queryConnections */
    public function __construct(
        private readonly array $allowedConnections = [],
        private readonly array $queryConnections = [],
    ) {}

    public function resolve(?string $requested, string $default): string
    {
        $connection = $this->normalize($requested, $default);
        if ($connection === $default || in_array($connection, $this->allowedConnections, true)) {
            return $connection;
        }
        throw new InvalidArgumentException('Database connection is not exposed through Titan MCP read tools.');
    }

    /**
     * Arbitrary SQL is never executed on the normal application connection.
     * Operators must configure a separate DB account/connection with DB-level read-only privileges.
     */
    public function resolveQuery(?string $requested, string $default): string
    {
        if (!(bool) config('titan_mcp.database.query_enabled', false)) {
            throw new InvalidArgumentException('Arbitrary Titan MCP SQL queries are disabled. Use schema tools or configure a dedicated query-only database connection.');
        }
        $connection = trim((string) ($requested ?? ''));
        if ($connection === '') {
            if (count($this->queryConnections) !== 1) {
                throw new InvalidArgumentException('A dedicated Titan MCP query-only connection must be selected explicitly.');
            }
            $connection = (string) $this->queryConnections[0];
        }
        $connection = $this->normalize($connection, $default);
        if ($connection === $default || !in_array($connection, $this->queryConnections, true)) {
            throw new InvalidArgumentException('Raw SQL requires an explicitly allowlisted query-only connection distinct from the application default connection.');
        }
        return $connection;
    }

    private function normalize(?string $requested, string $default): string
    {
        $connection = trim((string) ($requested ?? ''));
        if ($connection === '') $connection = $default;
        if (!preg_match('/^[A-Za-z0-9_.-]+$/', $connection)) {
            throw new InvalidArgumentException('Invalid database connection name.');
        }
        return $connection;
    }
}
