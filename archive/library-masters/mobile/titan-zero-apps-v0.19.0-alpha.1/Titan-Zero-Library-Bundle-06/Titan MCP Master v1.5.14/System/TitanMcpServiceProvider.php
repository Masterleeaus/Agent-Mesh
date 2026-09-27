<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System;

use App\Domains\Marketplace\Contracts\ExtensionRegisterKeyProviderInterface;
use App\Domains\Marketplace\Contracts\UninstallExtensionServiceProviderInterface;
use App\Extensions\TitanMcp\System\Http\Middleware\AuthorizeTitanMcp;
use App\Extensions\TitanMcp\System\Http\Middleware\TitanMcpCors;
use App\Extensions\TitanMcp\System\Http\Transport\McpToolInvoker;
use App\Extensions\TitanMcp\System\Mcp\Support\ApplicationContextInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\AuditLogger;
use App\Extensions\TitanMcp\System\Mcp\Support\BackupManager;
use App\Extensions\TitanMcp\System\Mcp\Support\BackupRetentionManager;
use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\CommandExecutionPolicy;
use App\Extensions\TitanMcp\System\Mcp\Support\CommandMutationService;
use App\Extensions\TitanMcp\System\Mcp\Support\DatabaseBackupManager;
use App\Extensions\TitanMcp\System\Mcp\Support\DatabaseMutationService;
use App\Extensions\TitanMcp\System\Mcp\Support\DatabaseReadPolicy;
use App\Extensions\TitanMcp\System\Mcp\Support\DatabaseSchemaInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\DatabaseWritePolicy;
use App\Extensions\TitanMcp\System\Mcp\Support\ExtensionInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\LogInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\McpRoutePrefixPolicy;
use App\Extensions\TitanMcp\System\Mcp\Support\McpTokenScopeGate;
use App\Extensions\TitanMcp\System\Mcp\Support\ModelMetadataInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\MutationService;
use App\Extensions\TitanMcp\System\Mcp\Support\MutationTicketStore;
use App\Extensions\TitanMcp\System\Mcp\Support\MutationPreparationService;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationLockManager;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationMetadataValidator;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationsInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\RecoveryInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\PathGuard;
use App\Extensions\TitanMcp\System\Mcp\Support\PlanningPromptBuilder;
use App\Extensions\TitanMcp\System\Mcp\Support\RepositoryReader;
use App\Extensions\TitanMcp\System\Mcp\Support\RuntimeDiagnostics;
use App\Extensions\TitanMcp\System\Mcp\Support\SecretRedactor;
use App\Extensions\TitanMcp\System\Mcp\Support\SqlGuard;
use App\Extensions\TitanMcp\System\Mcp\Support\TitanMcpMenuSynchronizer;
use App\Extensions\TitanMcp\System\Mcp\Support\TitanMcpSettingsRepository;
use App\Extensions\TitanMcp\System\Mcp\Support\TrustedOriginPolicy;
use App\Extensions\TitanMcp\System\Mcp\Support\WriteSafetyGate;
use App\Extensions\TitanMcp\System\Navigation\HostNavigationRegistrar;
use App\Extensions\TitanMcp\System\Navigation\TitanMcpNavigation;
use App\Extensions\TitanMcp\System\Workforce\WorkforceProviderRuntimeContract;
use App\Extensions\TitanMcp\System\Workforce\PackageWorkforceProviderAdapter;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthStoreContract;
use App\Extensions\TitanMcp\System\Workforce\LaravelCacheProviderHealthStore;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthRegistry;
use App\Extensions\TitanMcp\System\Workforce\CapabilityResolver;
use App\Extensions\TitanMcp\System\Workforce\ProviderSelector;
use App\Extensions\TitanMcp\System\Workforce\WorkforceProviderContribution;
use App\Extensions\TitanMcp\System\Workforce\WorkforceProviderEventEmitter;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthProbeContract;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthProbe;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthRefreshService;
use App\Extensions\TitanMcp\System\Workforce\WorkforceProviderStatusService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\Request;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\PermissionRegistrar;
use Throwable;

final class TitanMcpServiceProvider extends ServiceProvider implements ExtensionRegisterKeyProviderInterface, UninstallExtensionServiceProviderInterface
{
    public function registerKey(): string { return 'titan-mcp'; }

    public static function uninstall(): void
    {
        try {
            if (Schema::hasTable('menus')) app(\Illuminate\Database\DatabaseManager::class)->table('menus')->whereIn('key', TitanMcpMenuSynchronizer::keys())->delete();
            if (class_exists(\App\Services\Common\MenuService::class)) {
                $service = app(\App\Services\Common\MenuService::class);
                if (method_exists($service, 'regenerate')) $service->regenerate();
            }
            if (Schema::hasTable('permissions')) {
                $names = [
                    'titan_mcp','titan_mcp_overview','titan_mcp_tools','titan_mcp_runtime','titan_mcp_backups','titan_mcp_audit','titan_mcp_permissions','titan_mcp_settings','titan.mcp.admin','titan.mcp.access','titan.mcp.read','titan.mcp.repository.read','titan.mcp.database.read',
                    'titan.mcp.runtime.read','titan.mcp.logs.read','titan.mcp.backups.read','titan.mcp.execute.read',
                    'titan.mcp.repository.write','titan.mcp.repository.destructive','titan.mcp.database.write',
                    'titan.mcp.database.destructive','titan.mcp.execute.write','titan.mcp.execute.destructive','titan.mcp.*',
                ];
                $ids = app(\Illuminate\Database\DatabaseManager::class)->table('permissions')->where('guard_name','web')->whereIn('name',$names)->pluck('id')->all();
                if ($ids !== [] && Schema::hasTable('role_has_permissions')) app(\Illuminate\Database\DatabaseManager::class)->table('role_has_permissions')->whereIn('permission_id',$ids)->delete();
                app(\Illuminate\Database\DatabaseManager::class)->table('permissions')->where('guard_name','web')->whereIn('name',$names)->delete();
                if (class_exists(PermissionRegistrar::class)) app(PermissionRegistrar::class)->forgetCachedPermissions();
            }
        } catch (Throwable $e) { if (function_exists('report')) report($e); }
        // Recovery/audit data is retained by default for reinstall/forensics.
    }

    public function register(): void
    {
        
        $this->app->singleton('titan-apps.interface-contributions.titan-mcp', \App\Extensions\TitanMcp\System\Integration\TitanApps\TitanAppsContributionProvider::class);
        $this->app->singleton(ProviderHealthProbeContract::class, fn($app): ProviderHealthProbeContract => new ProviderHealthProbe(
            $app->make(WorkforceProviderRuntimeContract::class),
            $app
        ));
        $this->app->singleton(ProviderHealthRefreshService::class, fn($app): ProviderHealthRefreshService => new ProviderHealthRefreshService(
            $app->make(ProviderHealthProbeContract::class),
            $app->make(ProviderHealthStoreContract::class),
            $app->make(WorkforceProviderEventEmitter::class),
        ));
        $this->app->singleton(WorkforceProviderStatusService::class, fn($app): WorkforceProviderStatusService => new WorkforceProviderStatusService(
            $app->make(WorkforceProviderRuntimeContract::class),
            $app->make(ProviderHealthStoreContract::class),
        ));
// Agent-06 Pass 5: host-facing Workforce provider registration.
        $this->app->singleton(WorkforceProviderRuntimeContract::class, fn(): WorkforceProviderRuntimeContract => PackageWorkforceProviderAdapter::fromPackageRoot(dirname(__DIR__)));
        $this->app->singleton(ProviderHealthStoreContract::class, fn($app): ProviderHealthStoreContract => new LaravelCacheProviderHealthStore($app->make('cache.store')));
        $this->app->singleton(ProviderHealthRegistry::class, fn($app): ProviderHealthRegistry => new ProviderHealthRegistry($app->make(ProviderHealthStoreContract::class)));
        $this->app->singleton(CapabilityResolver::class, fn($app): CapabilityResolver => new CapabilityResolver($app->make(ProviderHealthRegistry::class)));
        $this->app->singleton(ProviderSelector::class);
        $this->app->singleton(WorkforceProviderEventEmitter::class, fn($app): WorkforceProviderEventEmitter => new WorkforceProviderEventEmitter($app->make('events')));
        $this->app->singleton(WorkforceProviderContribution::class, fn($app): WorkforceProviderContribution => new WorkforceProviderContribution(
            $app->make(WorkforceProviderRuntimeContract::class),
            $app->make(ProviderHealthStoreContract::class),
            $app->make(CapabilityResolver::class),
            $app->make(ProviderSelector::class),
        ));
        $this->app->tag([WorkforceProviderContribution::class], 'titan.workforce.providers');

        $this->mergeConfigFrom(__DIR__.'/../config/titan-mcp.php', 'titan_mcp');

        $this->app->singleton(TitanMcpSettingsRepository::class, function (): TitanMcpSettingsRepository {
            $repo = new TitanMcpSettingsRepository(storage_path('app/titan-mcp/settings.json'));
            $repo->applyToConfig();
            return $repo;
        });
        // Force settings application during registration before route/config consumers resolve.
        $this->app->make(TitanMcpSettingsRepository::class);
        $this->app->singleton(TitanMcpMenuSynchronizer::class);
        $this->app->singleton(TitanMcpNavigation::class);
        $this->app->singleton(HostNavigationRegistrar::class);
        $this->app->singleton(McpRoutePrefixPolicy::class);
        $this->app->singleton(McpToolInvoker::class);
        $this->app->singleton(McpTokenScopeGate::class, fn () => new McpTokenScopeGate((bool)config('titan_mcp.auth.require_token_scope',false),(string)config('titan_mcp.auth.token_scope','mcp:use')));
        $this->app->singleton(CapabilityGate::class, fn ($app) => new CapabilityGate($app->make(McpTokenScopeGate::class)));
        $this->app->singleton(TrustedOriginPolicy::class, fn () => new TrustedOriginPolicy((array)config('titan_mcp.http.cors_origins',[]), $this->app->environment('production')));
        $this->app->singleton(WriteSafetyGate::class);
        $this->app->singleton(OperationMetadataValidator::class, fn () => new OperationMetadataValidator(2000,256,256));
        $this->app->singleton(OperationLockManager::class, fn () => new OperationLockManager(storage_path('app/titan-mcp/locks'), max(0.05,(float)config('titan_mcp.execution.mutation_lock_timeout_seconds',10))));
        $this->app->singleton(BackupRetentionManager::class, fn () => new BackupRetentionManager(max(0,(int)config('titan_mcp.backups.retention_days',30)),max(1,(int)config('titan_mcp.backups.retention_max_deletes_per_run',50))));
        $this->app->singleton(PlanningPromptBuilder::class, fn () => new PlanningPromptBuilder(max(1,(int)config('titan_mcp.planning.max_goal_chars',12000))));
        $this->app->singleton(SecretRedactor::class);
        $this->app->singleton(OperationsInspector::class);
        $this->app->singleton(RecoveryInspector::class);
        $this->app->singleton(RuntimeDiagnostics::class, fn ($app) => new RuntimeDiagnostics(base_path(),$app->make(SecretRedactor::class)));
        $this->app->singleton(ApplicationContextInspector::class, fn ($app) => new ApplicationContextInspector(base_path(),$app->make(SecretRedactor::class),max(1,(int)config('titan_mcp.diagnostics.max_packages',250))));
        $this->app->singleton(ModelMetadataInspector::class, fn () => new ModelMetadataInspector(base_path()));
        $this->app->singleton(LogInspector::class, fn ($app) => new LogInspector(storage_path(),$app->make(SecretRedactor::class),max(1,(int)config('titan_mcp.diagnostics.max_log_bytes',1048576)),max(256,(int)config('titan_mcp.diagnostics.max_log_entry_chars',20000))));
        $this->app->singleton(SqlGuard::class);
        $this->app->singleton(DatabaseReadPolicy::class, fn () => new DatabaseReadPolicy((array)config('titan_mcp.database.read_connections',[]),(array)config('titan_mcp.database.query_connections',[])));
        $this->app->singleton(DatabaseSchemaInspector::class);
        $this->app->singleton(DatabaseWritePolicy::class, fn () => new DatabaseWritePolicy((array)config('titan_mcp.database.write_connections',[])));
        $this->app->singleton(CommandExecutionPolicy::class, fn ($app) => new CommandExecutionPolicy($app->make(DatabaseWritePolicy::class)));
        $this->app->singleton(AuditLogger::class, fn ($app) => new AuditLogger(storage_path('logs/titan-mcp-audit.jsonl'),$app->make(SecretRedactor::class)));
        $this->app->singleton(PathGuard::class, fn () => new PathGuard(base_path(),(array)config('titan_mcp.repository.write_roots'),(array)config('titan_mcp.repository.deny_patterns'),(array)config('titan_mcp.repository.write_root_files')));
        $this->app->singleton(RepositoryReader::class, fn () => new RepositoryReader(base_path(),(array)config('titan_mcp.repository.read_roots'),(array)config('titan_mcp.repository.read_root_files'),(array)config('titan_mcp.repository.deny_patterns')));
        $this->app->singleton(ExtensionInspector::class, fn () => new ExtensionInspector(base_path()));
        $this->app->singleton(BackupManager::class, fn ($app) => new BackupManager(base_path(),storage_path('app/titan-mcp/backups/filesystem'),$app->make(PathGuard::class),$app->make(BackupRetentionManager::class)));
        $this->app->singleton(DatabaseBackupManager::class, fn ($app) => new DatabaseBackupManager($app->make(DatabaseManager::class),storage_path('app/titan-mcp/backups/database'),$app->make(BackupRetentionManager::class)));
        $this->app->singleton(MutationService::class, fn ($app) => new MutationService(base_path(),$app->make(PathGuard::class),$app->make(BackupManager::class),$app->make(AuditLogger::class),max(1024,(int)config('titan_mcp.repository.max_write_bytes',1048576))));
        $this->app->singleton(MutationTicketStore::class, fn () => new MutationTicketStore((string)config('titan_mcp.mutation_tickets.root', storage_path('app/titan-mcp/mutation-tickets'))));
        $this->app->singleton(MutationPreparationService::class);
        $this->app->singleton(DatabaseMutationService::class, fn ($app) => new DatabaseMutationService($app->make(DatabaseManager::class),$app->make(DatabaseBackupManager::class),$app->make(AuditLogger::class),$app->make(SqlGuard::class),$app->make(DatabaseWritePolicy::class)));
        $this->app->singleton(CommandMutationService::class, fn ($app) => new CommandMutationService(base_path(),$app->make(BackupManager::class),$app->make(DatabaseBackupManager::class),$app->make(AuditLogger::class),$app->make(SecretRedactor::class),$app->make(CommandExecutionPolicy::class)));
    }

    public function boot(Router $router): void
    {
        $router->aliasMiddleware('titan.mcp.authorize', AuthorizeTitanMcp::class);
        $router->aliasMiddleware('titan.mcp.cors', TitanMcpCors::class);
        RateLimiter::for('titan-mcp-ip', static fn (Request $request): Limit => Limit::perMinute(max(1,(int)config('titan_mcp.http.rate_limit_ip_per_minute',60)))->by('ip:'.(string)$request->ip()));
        RateLimiter::for('titan-mcp-actor', static fn (Request $request): Limit => Limit::perMinute(max(1,(int)config('titan_mcp.http.rate_limit_actor_per_minute',120)))->by('actor:'.(string)($request->user()?->getAuthIdentifier() ?: $request->ip())));

        $this->loadViewsFrom(__DIR__.'/../resources/views', 'titan-mcp');
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadRoutesFrom(__DIR__.'/../routes/admin.php');
        $this->loadRoutesFrom(__DIR__.'/../routes/mcp.php');
        $this->app->make(HostNavigationRegistrar::class)->register();
        $this->app->booted(static function (): void { app(TitanMcpMenuSynchronizer::class)->sync(); });
    }
}
