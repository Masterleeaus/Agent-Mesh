<?php

declare(strict_types=1);

$originEnv = (string) env('TITAN_MCP_CORS_ORIGINS', env('TITAN_MCP_CORS_ORIGIN', env('APP_URL', '')));
$origins = array_values(array_unique(array_filter(array_map(
    static fn (string $origin): string => rtrim(trim($origin), '/'),
    explode(',', $originEnv)
))));

return [
    'enabled' => (bool) env('TITAN_MCP_ENABLED', true),
    'server' => [
        'name' => env('TITAN_MCP_SERVER_NAME', 'Titan Zero MCP'),
        'version' => env('TITAN_MCP_SERVER_VERSION', '1.5.14'),
    ],
    'auth' => [
        'private_user_ids' => array_values(array_filter(array_map('trim', explode(',', (string) env('TITAN_MCP_PRIVATE_USER_IDS', ''))))),
        // Optional OAuth/token-scope hardening inspired by official Laravel MCP governance.
        'require_token_scope' => (bool) env('TITAN_MCP_REQUIRE_TOKEN_SCOPE', false),
        'token_scope' => (string) env('TITAN_MCP_TOKEN_SCOPE', 'mcp:use'),
    ],
    'http' => [
        'route_prefix' => trim((string) env('TITAN_MCP_ROUTE_PREFIX', 'mcp/titan'), '/'),
        'middleware' => ['titan.mcp.cors', \Illuminate\Routing\Middleware\SubstituteBindings::class, 'throttle:titan-mcp-ip', 'auth:api', 'throttle:titan-mcp-actor', 'titan.mcp.authorize'],
        'cors_origins' => $origins,
        // Layered throttles: pre-auth IP protects credential attack surface; post-auth actor isolates authenticated clients.
        'rate_limit_ip_per_minute' => (int) env('TITAN_MCP_RATE_LIMIT_IP_PER_MINUTE', 60),
        'rate_limit_actor_per_minute' => (int) env('TITAN_MCP_RATE_LIMIT_ACTOR_PER_MINUTE', env('TITAN_MCP_RATE_LIMIT_PER_MINUTE', 120)),
    ],
    'security' => [
        // Required before production writes because backups may contain confidential source/database data.
        'storage_encryption_attested' => (bool) env('TITAN_MCP_STORAGE_ENCRYPTION_AT_REST', false),
    ],
    'repository' => [
        // Extensions remain first-class project code. app/Extensions is intentionally included.
        'read_roots' => ['app', 'bootstrap', 'config', 'database', 'public', 'resources', 'routes', 'packages', 'tests', 'scripts', 'docs'],
        'read_root_files' => ['composer.json', 'composer.lock', 'package.json', 'package-lock.json', 'vite.config.js', 'vite.config.mjs', 'postcss.config.js', 'phpunit.xml'],
        'search_roots' => ['app', 'bootstrap', 'config', 'database', 'public', 'resources', 'routes', 'packages', 'tests', 'scripts', 'docs', 'composer.json', 'composer.lock', 'package.json', 'package-lock.json', 'vite.config.mjs', 'phpunit.xml'],
        'write_roots' => ['app', 'bootstrap', 'config', 'database', 'public', 'resources', 'routes', 'packages', 'tests', 'scripts', 'docs'],
        'write_root_files' => ['composer.json', 'composer.lock', 'package.json', 'package-lock.json', 'vite.config.mjs', 'postcss.config.js', 'phpunit.xml'],
        'max_write_bytes' => (int) env('TITAN_MCP_REPOSITORY_MAX_WRITE_BYTES', 1048576),
        'deny_patterns' => [
            '.env', '.env.*', '*.pem', '*.key', '*.p12', '*.pfx',
            'storage/oauth-*', 'storage/framework/sessions/*', 'storage/logs/*',
            'storage/app/titan-mcp', 'storage/app/titan-mcp/*',
            'bootstrap/cache/*.php',
            'vendor/*', 'node_modules/*', '.git/*',
        ],
    ],
    'diagnostics' => [
        'max_routes' => (int) env('TITAN_MCP_DIAGNOSTICS_MAX_ROUTES', 1000),
        'max_log_entries' => (int) env('TITAN_MCP_DIAGNOSTICS_MAX_LOG_ENTRIES', 250),
        'max_log_bytes' => (int) env('TITAN_MCP_DIAGNOSTICS_MAX_LOG_BYTES', 1048576),
        'max_log_entry_chars' => (int) env('TITAN_MCP_DIAGNOSTICS_MAX_LOG_ENTRY_CHARS', 20000),
        'max_packages' => (int) env('TITAN_MCP_DIAGNOSTICS_MAX_PACKAGES', 250),
        'max_model_metadata' => (int) env('TITAN_MCP_DIAGNOSTICS_MAX_MODEL_METADATA', 100),
    ],

    'planning' => [
        'max_goal_chars' => (int) env('TITAN_MCP_PLANNING_MAX_GOAL_CHARS', 12000),
    ],

    'mutation_tickets' => [
        'root' => storage_path('app/titan-mcp/mutation-tickets'),
        'default_ttl_seconds' => (int) env('TITAN_MCP_MUTATION_TICKET_TTL', 300),
        'max_ttl_seconds' => (int) env('TITAN_MCP_MUTATION_TICKET_MAX_TTL', 900),
        'max_argument_bytes' => (int) env('TITAN_MCP_MUTATION_TICKET_MAX_ARGUMENT_BYTES', 12582912),
    ],

    'database' => [
        // The default Laravel connection is always readable; extras must be explicit.
        'query_enabled' => (bool) env('TITAN_MCP_DATABASE_QUERY_ENABLED', false),
        'query_connections' => array_values(array_filter(array_map('trim', explode(',', (string) env('TITAN_MCP_DATABASE_QUERY_CONNECTIONS', ''))))),
        'read_connections' => array_values(array_filter(array_map('trim', explode(',', (string) env('TITAN_MCP_DATABASE_READ_CONNECTIONS', ''))))),
        'max_read_rows' => (int) env('TITAN_MCP_DATABASE_MAX_READ_ROWS', 1000),
        'max_bindings' => (int) env('TITAN_MCP_DATABASE_MAX_BINDINGS', 200),
        // The default connection is always writable when DB writes are enabled; extras require explicit allowlisting.
        'write_connections' => array_values(array_filter(array_map('trim', explode(',', (string) env('TITAN_MCP_DATABASE_WRITE_CONNECTIONS', ''))))),
        'max_write_bindings' => (int) env('TITAN_MCP_DATABASE_MAX_WRITE_BINDINGS', 200),
        'max_write_sql_chars' => (int) env('TITAN_MCP_DATABASE_MAX_WRITE_SQL_CHARS', 100000),
    ],
    'write' => [
        'enabled' => (bool) env('TITAN_MCP_WRITE_ENABLED', true),
        'database_enabled' => (bool) env('TITAN_MCP_DATABASE_WRITE_ENABLED', true),
    ],
    'destructive' => [
        'enabled' => (bool) env('TITAN_MCP_DESTRUCTIVE_ENABLED', false),
    ],
    'backups' => [
        'retention_days' => (int) env('TITAN_MCP_BACKUP_RETENTION_DAYS', 30),
        'retention_max_deletes_per_run' => (int) env('TITAN_MCP_BACKUP_RETENTION_MAX_DELETES', 50),
        'mysqldump_binary' => env('TITAN_MCP_MYSQLDUMP_BINARY', 'mysqldump'),
        'mysql_binary' => env('TITAN_MCP_MYSQL_BINARY', 'mysql'),
        'pg_dump_binary' => env('TITAN_MCP_PG_DUMP_BINARY', 'pg_dump'),
        'psql_binary' => env('TITAN_MCP_PSQL_BINARY', 'psql'),
        'allow_legacy_database_restore' => (bool) env('TITAN_MCP_ALLOW_LEGACY_DATABASE_RESTORE', false),
    ],
    'execution' => [
        'enabled' => (bool) env('TITAN_MCP_EXECUTION_ENABLED', true),
        'timeout_seconds' => (int) env('TITAN_MCP_EXECUTION_TIMEOUT', 600),
        'readonly_timeout_seconds' => (int) env('TITAN_MCP_READONLY_EXECUTION_TIMEOUT', 120),
        'max_output_chars' => (int) env('TITAN_MCP_EXECUTION_MAX_OUTPUT', 20000),
        'recover_failed_mutations' => (bool) env('TITAN_MCP_RECOVER_FAILED_COMMANDS', true),
        'mutation_lock_timeout_seconds' => (float) env('TITAN_MCP_MUTATION_LOCK_TIMEOUT', 10),
        'denied_commands' => [
            'tinker', 'serve', 'queue:listen', 'queue:work', 'schedule:work', 'octane:*', 'horizon',
            // key:generate writes .env, which is intentionally outside generic MCP backup/write scope.
            'key:generate', 'env:*',
        ],
    ],
];
