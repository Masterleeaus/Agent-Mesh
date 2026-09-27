<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;

final class DatabaseSchemaInspector
{
    public function tables(object $connection, ?string $filter = null, int $limit = 500): array
    {
        $driver = (string) $connection->getDriverName();
        $limit = min(max($limit, 1), 1000);
        $filter = trim((string) $filter);
        $rows = match ($driver) {
            'mysql', 'mariadb' => $connection->select(
                'SELECT TABLE_NAME AS name, ENGINE AS engine, TABLE_ROWS AS estimated_rows, DATA_LENGTH AS data_bytes, INDEX_LENGTH AS index_bytes '
                .'FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = \'BASE TABLE\' ORDER BY TABLE_NAME'
            ),
            'pgsql' => $connection->select(
                "SELECT schemaname AS schema, tablename AS name FROM pg_tables WHERE schemaname = current_schema() ORDER BY tablename"
            ),
            'sqlite' => $connection->select(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            ),
            default => [],
        };

        $tables = array_map(static fn (object|array $row): array => (array) $row, $rows);
        if ($filter !== '') {
            $needle = strtolower($filter);
            $tables = array_values(array_filter($tables, static fn (array $row): bool => str_contains(strtolower((string) ($row['name'] ?? '')), $needle)));
        }
        $total = count($tables);
        $tables = array_slice($tables, 0, $limit);
        foreach ($tables as &$table) {
            if (isset($table['estimated_rows'])) $table['estimated_rows'] = (int) $table['estimated_rows'];
            if (isset($table['data_bytes'])) $table['data_bytes'] = (int) $table['data_bytes'];
            if (isset($table['index_bytes'])) $table['index_bytes'] = (int) $table['index_bytes'];
        }
        unset($table);

        return [
            'driver' => $driver,
            'tables' => $tables,
            'count' => count($tables),
            'total_matching' => $total,
            'truncated' => $total > count($tables),
        ];
    }

    public function table(object $connection, string $table): array
    {
        $this->assertIdentifier($table);
        $driver = (string) $connection->getDriverName();

        return match ($driver) {
            'mysql', 'mariadb' => $this->mysqlTable($connection, $table, $driver),
            'pgsql' => $this->pgsqlTable($connection, $table),
            'sqlite' => $this->sqliteTable($connection, $table),
            default => ['driver' => $driver, 'table' => $table, 'columns' => [], 'indexes' => [], 'foreign_keys' => []],
        };
    }

    private function mysqlTable(object $connection, string $table, string $driver): array
    {
        $columns = array_map(static function (object|array $row): array {
            $item = (array) $row;
            return [
                'name' => (string) ($item['name'] ?? ''),
                'type' => (string) ($item['type'] ?? ''),
                'data_type' => (string) ($item['data_type'] ?? ''),
                'nullable' => strtoupper((string) ($item['nullable'] ?? 'NO')) === 'YES',
                'default' => $item['default_value'] ?? null,
                'column_key' => (string) ($item['column_key'] ?? ''),
                'auto_increment' => str_contains(strtolower((string) ($item['extra'] ?? '')), 'auto_increment'),
                'extra' => (string) ($item['extra'] ?? ''),
                'comment' => (string) ($item['comment'] ?? ''),
                'max_length' => isset($item['max_length']) ? (int) $item['max_length'] : null,
            ];
        }, $connection->select(
            'SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, DATA_TYPE AS data_type, IS_NULLABLE AS nullable, '
            .'COLUMN_DEFAULT AS default_value, COLUMN_KEY AS column_key, EXTRA AS extra, COLUMN_COMMENT AS comment, '
            .'CHARACTER_MAXIMUM_LENGTH AS max_length FROM information_schema.COLUMNS '
            .'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION', [$table]
        ));

        if ($columns === []) {
            throw new InvalidArgumentException('Unknown table name.');
        }

        $rawIndexes = array_map(static fn (object|array $row): array => (array) $row, $connection->select(
            'SELECT INDEX_NAME AS name, NON_UNIQUE AS non_unique, SEQ_IN_INDEX AS sequence, COLUMN_NAME AS column_name, INDEX_TYPE AS index_type '
            .'FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY INDEX_NAME, SEQ_IN_INDEX', [$table]
        ));
        $grouped = [];
        foreach ($rawIndexes as $index) {
            $name = (string) ($index['name'] ?? '');
            if (!isset($grouped[$name])) {
                $grouped[$name] = [
                    'name' => $name,
                    'columns' => [],
                    'unique' => (int) ($index['non_unique'] ?? 1) === 0,
                    'primary' => strtoupper($name) === 'PRIMARY',
                    'type' => (string) ($index['index_type'] ?? ''),
                ];
            }
            $grouped[$name]['columns'][] = (string) ($index['column_name'] ?? '');
        }

        $foreignKeys = array_map(static function (object|array $row): array {
            $item = (array) $row;
            return [
                'name' => (string) ($item['name'] ?? ''),
                'column' => (string) ($item['column_name'] ?? ''),
                'referenced_table' => (string) ($item['referenced_table'] ?? ''),
                'referenced_column' => (string) ($item['referenced_column'] ?? ''),
            ];
        }, $connection->select(
            'SELECT CONSTRAINT_NAME AS name, COLUMN_NAME AS column_name, REFERENCED_TABLE_NAME AS referenced_table, '
            .'REFERENCED_COLUMN_NAME AS referenced_column FROM information_schema.KEY_COLUMN_USAGE '
            .'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION', [$table]
        ));

        return [
            'driver' => $driver,
            'table' => $table,
            'columns' => $columns,
            'indexes' => array_values($grouped),
            'foreign_keys' => $foreignKeys,
        ];
    }

    private function pgsqlTable(object $connection, string $table): array
    {
        $columns = array_map(static fn (object|array $row): array => (array) $row, $connection->select(
            'SELECT column_name AS name, data_type AS type, is_nullable AS nullable, column_default AS default_value '
            .'FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? ORDER BY ordinal_position', [$table]
        ));
        if ($columns === []) throw new InvalidArgumentException('Unknown table name.');
        $indexes = array_map(static fn (object|array $row): array => (array) $row, $connection->select(
            'SELECT indexname AS name, indexdef AS definition FROM pg_indexes WHERE schemaname = current_schema() AND tablename = ?', [$table]
        ));
        $foreignKeys = array_map(static function (object|array $row): array {
            $item = (array) $row;
            return [
                'name' => (string) ($item['name'] ?? ''),
                'column' => (string) ($item['column_name'] ?? ''),
                'referenced_table' => (string) ($item['referenced_table'] ?? ''),
                'referenced_column' => (string) ($item['referenced_column'] ?? ''),
            ];
        }, $connection->select(
            "SELECT tc.constraint_name AS name, kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column "
            ."FROM information_schema.table_constraints tc "
            ."JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema "
            ."JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema "
            ."WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = current_schema() AND tc.table_name = ? "
            ."ORDER BY tc.constraint_name, kcu.ordinal_position", [$table]
        ));
        return ['driver' => 'pgsql', 'table' => $table, 'columns' => $columns, 'indexes' => $indexes, 'foreign_keys' => $foreignKeys];
    }

    private function sqliteTable(object $connection, string $table): array
    {
        $quoted = "'".str_replace("'", "''", $table)."'";
        $columns = array_map(static fn (object|array $row): array => (array) $row, $connection->select("PRAGMA table_info({$quoted})"));
        if ($columns === []) throw new InvalidArgumentException('Unknown table name.');
        $indexes = array_map(static fn (object|array $row): array => (array) $row, $connection->select("PRAGMA index_list({$quoted})"));
        $foreignKeys = array_map(static fn (object|array $row): array => (array) $row, $connection->select("PRAGMA foreign_key_list({$quoted})"));
        return ['driver' => 'sqlite', 'table' => $table, 'columns' => $columns, 'indexes' => $indexes, 'foreign_keys' => $foreignKeys];
    }

    private function assertIdentifier(string $identifier): void
    {
        if (!preg_match('/^[A-Za-z0-9_]+$/', $identifier)) {
            throw new InvalidArgumentException('Invalid table name.');
        }
    }
}
