<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\DatabaseReadPolicy;
use App\Extensions\TitanMcp\System\Mcp\Support\DatabaseSchemaInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\SecretRedactor;
use App\Extensions\TitanMcp\System\Mcp\Support\SqlGuard;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;

final class SchemaTools
{
    public function __construct(
        private readonly DatabaseManager $db,
        private readonly CapabilityGate $gate,
        private readonly SqlGuard $sqlGuard,
        private readonly SecretRedactor $redactor,
        private readonly DatabaseReadPolicy $readPolicy,
        private readonly DatabaseSchemaInspector $schemaInspector,
    ) {}
    public function tables(?string $connection = null, ?string $filter = null, int $limit = 500): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.database.read');
        $name = $this->resolveConnection($connection);
        $result = $this->schemaInspector->tables($this->db->connection($name), $filter, $limit);
        return ['connection' => $name] + $result;
    }
    public function table(string $table, ?string $connection = null): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.database.read');
        if (!preg_match('/^[A-Za-z0-9_]+$/', $table)) {
            throw new InvalidArgumentException('Invalid table name.');
        }
        $name = $this->resolveConnection($connection);
        $result = $this->schemaInspector->table($this->db->connection($name), $table);
        return ['connection' => $name] + $result;
    }
    public function queryReadonly(string $sql, array $bindings = [], int $limit = 200, ?string $connection = null): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.database.read');
        $this->sqlGuard->assertReadOnly($sql);
        if (count($bindings) > (int) config('titan_mcp.database.max_bindings', 200)) {
            throw new InvalidArgumentException('Too many SQL bindings.');
        }
        $maxRows = max(1, (int) config('titan_mcp.database.max_read_rows', 1000));
        $limit = min(max($limit, 1), $maxRows);
        $name = $this->readPolicy->resolveQuery($connection, (string) config('database.default'));
        $conn = $this->db->connection($name);
        $driver = strtolower((string) $conn->getDriverName());
        $rows = [];
        $truncated = false;
        $transactionStarted = false;
        $sqliteQueryOnly = false;

        try {
            if (in_array($driver, ['mysql', 'mariadb'], true)) {
                $conn->statement('SET TRANSACTION READ ONLY');
                $conn->beginTransaction();
                $transactionStarted = true;
            } elseif ($driver === 'pgsql') {
                $conn->beginTransaction();
                $transactionStarted = true;
                $conn->statement('SET TRANSACTION READ ONLY');
            } elseif ($driver === 'sqlite') {
                $conn->statement('PRAGMA query_only = ON');
                $sqliteQueryOnly = true;
            } else {
                throw new InvalidArgumentException('Raw SQL query-only execution is not supported for this database driver.');
            }

            foreach ($conn->cursor(trim($sql), $bindings) as $row) {
                if (count($rows) >= $limit) {
                    $truncated = true;
                    break;
                }
                $rows[] = (array) $row;
            }
        } finally {
            if ($transactionStarted) {
                $conn->rollBack();
            }
            if ($sqliteQueryOnly) {
                $conn->statement('PRAGMA query_only = OFF');
            }
        }

        $rows = $this->redactor->redact($rows);
        return [
            'connection' => $name,
            'driver' => $driver,
            'rows' => $rows,
            'count' => count($rows),
            'limit' => $limit,
            'truncated' => $truncated,
        ];
    }

    private function resolveConnection(?string $connection): string
    {
        return $this->readPolicy->resolve($connection, (string) config('database.default'));
    }
}
