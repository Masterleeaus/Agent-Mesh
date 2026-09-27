<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use RuntimeException;

final class DatabaseWritePolicy
{
    /** @param list<string> $additionalConnections */
    public function __construct(private readonly array $additionalConnections = []) {}

    public function resolve(?string $requested): string
    {
        $default = trim((string) config('database.default', ''));
        if ($default === '') {
            throw new RuntimeException('Laravel default database connection is not configured.');
        }

        $connection = trim((string) ($requested ?? $default));
        if ($connection === '' || preg_match('/^[A-Za-z0-9_.-]+$/', $connection) !== 1) {
            throw new RuntimeException('Invalid database write connection name.');
        }

        $allowed = array_values(array_unique(array_filter(array_merge([$default], array_map(
            static fn (mixed $value): string => trim((string) $value),
            $this->additionalConnections,
        )))));
        if (!in_array($connection, $allowed, true)) {
            throw new RuntimeException("Database write connection '{$connection}' is not allowlisted.");
        }

        if (!is_array(config("database.connections.{$connection}"))) {
            throw new RuntimeException("Unknown database connection '{$connection}'.");
        }

        return $connection;
    }
}
