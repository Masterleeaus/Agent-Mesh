<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Mcp\Support\AuditLogger;
use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\LogInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\McpTokenScopeGate;
use App\Extensions\TitanMcp\System\Mcp\Support\RuntimeDiagnostics;
use App\Extensions\TitanMcp\System\Mcp\Support\SecretRedactor;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

final class RuntimeTools
{
    public function __construct(
        private readonly CapabilityGate $gate,
        private readonly SecretRedactor $redactor,
        private readonly RuntimeDiagnostics $runtime,
        private readonly LogInspector $logs,
        private readonly McpTokenScopeGate $tokenScopeGate,
        private readonly AuditLogger $audit,
    ) {}
    public function health(): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.runtime.read');

        $defaultDriver = (string) config('database.connections.'.config('database.default').'.driver', '');
        $requiredBinaries = match ($defaultDriver) {
            'mysql', 'mariadb' => [(string) config('titan_mcp.backups.mysqldump_binary','mysqldump'), (string) config('titan_mcp.backups.mysql_binary','mysql')],
            'pgsql' => [(string) config('titan_mcp.backups.pg_dump_binary','pg_dump'), (string) config('titan_mcp.backups.psql_binary','psql')],
            default => [],
        };
        $recoveryReadiness = $this->runtime->recoveryReadiness($requiredBinaries, [
            storage_path('app/titan-mcp/backups/filesystem'),
            storage_path('app/titan-mcp/backups/database'),
            storage_path('app/titan-mcp/locks'),
        ]);
        $auditIntegrity = $this->audit->verifyIntegrity();

        $checks = [
            'storage_writable' => is_writable(storage_path()),
            'bootstrap_cache_writable' => is_writable(base_path('bootstrap/cache')),
            'composer_lock_present' => is_file(base_path('composer.lock')),
            'vendor_autoload_present' => is_file(base_path('vendor/autoload.php')),
            'mcp_extension_provider_present' => class_exists(\App\Extensions\TitanMcp\System\TitanMcpServiceProvider::class),
            'mcp_transport_runtime_loaded' => class_exists(\App\Extensions\TitanMcp\System\Http\Transport\McpTransportController::class),
            'mcp_catalogue_runtime_loaded' => class_exists(\App\Extensions\TitanMcp\System\Mcp\Support\McpCatalogue::class),
            'recovery_dependencies_ready' => (bool) ($recoveryReadiness['ready'] ?? false),
            'audit_integrity_valid' => (bool) ($auditIntegrity['valid'] ?? false),
            'storage_encryption_attested' => !app()->environment('production') || (bool) config('titan_mcp.security.storage_encryption_attested', false),
        ];

        $critical = ['storage_writable', 'bootstrap_cache_writable', 'mcp_catalogue_runtime_loaded', 'recovery_dependencies_ready', 'audit_integrity_valid', 'storage_encryption_attested'];
        $status = 'ok';
        foreach ($critical as $check) {
            if (($checks[$check] ?? false) !== true) {
                $status = 'degraded';
                break;
            }
        }

        $app = app();
        $configurationCached = method_exists($app, 'configurationIsCached') ? (bool) $app->configurationIsCached() : null;
        $routesCached = method_exists($app, 'routesAreCached') ? (bool) $app->routesAreCached() : null;
        $maintenanceMode = method_exists($app, 'isDownForMaintenance') ? (bool) $app->isDownForMaintenance() : null;

        return $this->redactor->redact([
            'status' => $status,
            'environment' => $app->environment(),
            'debug' => (bool) config('app.debug'),
            'maintenance_mode' => $maintenanceMode,
            'timezone' => config('app.timezone'),
            'locale' => config('app.locale'),
            'drivers' => [
                'cache' => config('cache.default'),
                'queue' => config('queue.default'),
                'session' => config('session.driver'),
                'database' => config('database.default'),
                'logging' => config('logging.default'),
            ],
            'cache_state' => [
                'configuration_cached' => $configurationCached,
                'routes_cached' => $routesCached,
            ],
            'route_count' => count(Route::getRoutes()),
            'checks' => $checks,
            'versions' => $this->runtime->versions((string) $app->version()),
            'recovery_readiness' => $recoveryReadiness,
            'audit_integrity' => $auditIntegrity,
            'mcp_auth' => [
                'token_scope' => $this->tokenScopeGate->posture(),
                'transport' => 'extension_streamable_http_json',
                'session_mode' => 'stateless',
            ],
        ]);
    }
    public function routes(string $query = '', int $limit = 200): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.runtime.read');

        $items = [];
        foreach (Route::getRoutes() as $route) {
            try {
                $middleware = $route->gatherMiddleware();
            } catch (\Throwable) {
                $middleware = (array) ($route->getAction('middleware') ?? []);
            }
            $methods = array_values(array_unique(array_map('strval', $route->methods())));
            sort($methods, SORT_STRING);
            $items[] = [
                'methods' => $methods,
                'uri' => $route->uri(),
                'name' => $route->getName(),
                'action' => $route->getActionName(),
                'middleware' => array_values(array_map('strval', (array) $middleware)),
                'domain' => $route->getDomain(),
            ];
        }

        return $this->runtime->routes(
            $items,
            $query,
            $limit,
            max(1, (int) config('titan_mcp.diagnostics.max_routes', 1000)),
        );
    }
    public function recentLogs(int $lines = 150, string $source = 'application'): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.logs.read');
        $maxEntries = max(1, (int) config('titan_mcp.diagnostics.max_log_entries', 250));

        return $this->logs->inspectSource(
            (array) config('logging', []),
            $source,
            min(max($lines, 1), $maxEntries),
        );
    }
}
