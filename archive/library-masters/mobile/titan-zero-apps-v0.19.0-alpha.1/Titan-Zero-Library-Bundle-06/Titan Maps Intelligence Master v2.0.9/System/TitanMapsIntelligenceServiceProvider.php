<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\System;

use App\Extensions\TitanMapsIntelligence\Console\EscalateResourceFallbacksCommand;
use App\Extensions\TitanMapsIntelligence\Services\ProviderHealthService;
use App\Extensions\TitanMapsIntelligence\Services\FieldRouteOptimizationProposalService;
use App\Domains\Marketplace\Contracts\ExtensionRegisterKeyProviderInterface;
use App\Domains\Marketplace\Contracts\UninstallExtensionServiceProviderInterface;
use App\Extensions\TitanMapsIntelligence\Contracts\AdminPermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\CandidateRepository;
use App\Extensions\TitanMapsIntelligence\Contracts\FieldReferenceGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\FieldSpatialPeerGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\CapabilityRegistrar;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Contracts\PrivateExportStore;
use App\Extensions\TitanMapsIntelligence\Contracts\ProviderHttpTransport;
use App\Extensions\TitanMapsIntelligence\Contracts\QueueTenantContext;
use App\Extensions\TitanMapsIntelligence\Contracts\SecretResolver;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkCoreCandidateGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkCoreCandidateLookup;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkerIdentityResolver;
use App\Extensions\TitanMapsIntelligence\Contracts\DispatchEvidenceGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\GeographicPricingSignalProvider;
use App\Extensions\TitanMapsIntelligence\Contracts\DispatchAssignmentGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkerQualificationGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialRiskGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialAssuranceGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialAutonomyGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialCommandBusGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialRewindRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialKnowledgeGateway;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Http\Middleware\RejectClientCompanyOverride;
use App\Extensions\TitanMapsIntelligence\Http\Middleware\RequireMapsAdminPermission;
use App\Extensions\TitanMapsIntelligence\Http\Middleware\RequireMapsInternalRequest;
use App\Extensions\TitanMapsIntelligence\Http\Middleware\RequireMapsPermission;
use App\Extensions\TitanMapsIntelligence\Http\Middleware\ResolveCompanyScopedRouteBindings;
use App\Extensions\TitanMapsIntelligence\Http\Middleware\ResolveMapsCompanyContext;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use App\Extensions\TitanMapsIntelligence\Models\MapProviderConnection;
use App\Extensions\TitanMapsIntelligence\Policies\DiscoveryCandidatePolicy;
use App\Extensions\TitanMapsIntelligence\Policies\DiscoverySearchPolicy;
use App\Extensions\TitanMapsIntelligence\Providers\GeocodingProviderRegistry;
use App\Extensions\TitanMapsIntelligence\Providers\GoogleGeocodingProvider;
use App\Extensions\TitanMapsIntelligence\Providers\GooglePlacesProvider;
use App\Extensions\TitanMapsIntelligence\Providers\GoogleRoutesProvider;
use App\Extensions\TitanMapsIntelligence\Providers\LaravelProviderHttpTransport;
use App\Extensions\TitanMapsIntelligence\Providers\PlacesProviderRegistry;
use App\Extensions\TitanMapsIntelligence\Providers\RoutingProviderRegistry;
use App\Extensions\TitanMapsIntelligence\Providers\TrafficProviderRegistry;
use App\Extensions\TitanMapsIntelligence\Repositories\EloquentCandidateRepository;
use App\Extensions\TitanMapsIntelligence\Services\GateAdminPermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\EnvironmentSecretResolver;
use App\Extensions\TitanMapsIntelligence\Services\GatePermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\ServiceTerritoryService;
use App\Extensions\TitanMapsIntelligence\Services\LocalCapabilityRegistrar;
use App\Extensions\TitanMapsIntelligence\Services\LocalPrivateExportStore;
use App\Extensions\TitanMapsIntelligence\Services\LogAuditRecorder;
use App\Extensions\TitanMapsIntelligence\Services\RequestAuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableWorkCoreGateway;
use App\Extensions\TitanMapsIntelligence\Services\InMemoryQueueTenantContext;
use App\Extensions\TitanMapsIntelligence\Services\MapsCapabilityService;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\WorkCoreFieldReferenceGateway;
use App\Extensions\TitanMapsIntelligence\Services\FieldSpatialPeerService;
use App\Extensions\TitanMapsIntelligence\Services\OfflineWorkerLocationSyncService;
use App\Extensions\TitanMapsIntelligence\Services\NearestResourceService;
use App\Extensions\TitanMapsIntelligence\Services\TitanFieldReferenceGateway;
use App\Extensions\TitanMapsIntelligence\Services\TitanFieldDispatchEvidenceGateway;
use App\Extensions\TitanMapsIntelligence\Services\TitanFieldDispatchAssignmentGateway;
use App\Extensions\TitanMapsIntelligence\Services\TitanFieldWorkerQualificationGateway;
use App\Extensions\TitanMapsIntelligence\Services\AuthenticatedWorkerIdentityResolver;
use App\Extensions\TitanMapsIntelligence\Services\CrmDispatchEvidenceGateway;
use App\Extensions\TitanMapsIntelligence\Services\CrmDispatchAssignmentGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnknownWorkerQualificationGateway;
use App\Extensions\TitanMapsIntelligence\Services\DispatchScoreService;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialRiskGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialAssuranceGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialAutonomyGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialCommandBusGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialKnowledgeGateway;
use App\Extensions\TitanMapsIntelligence\Services\LocalSpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\Services\LocalSpatialRewindRecorder;
use App\Extensions\TitanMapsIntelligence\Services\SpatialExecutionContextStore;
use App\Extensions\TitanMapsIntelligence\Support\GoogleDurationParser;
use App\Extensions\TitanMapsIntelligence\Support\GooglePlacesNormalizer;
use App\Extensions\TitanMapsIntelligence\Support\RequiredHostContract;
use App\Extensions\TitanMapsIntelligence\System\Navigation\MapsMenuInstaller;
use App\Extensions\TitanMapsIntelligence\Console\PruneWorkerLocationPingsCommand;
use App\Extensions\TitanMapsIntelligence\Console\ProcessGeofencesCommand;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

final class TitanMapsIntelligenceServiceProvider extends ServiceProvider implements ExtensionRegisterKeyProviderInterface, UninstallExtensionServiceProviderInterface
{
    public function register(): void
    {
        // Agent 2 Titan Apps convergence: expose semantic contributions through container discovery; no UI/runtime authority lives here.
        $this->app->singleton(\App\Extensions\TitanMapsIntelligence\System\TitanApps\ProviderInterfaceContributionCatalog::class);
        $this->app->tag([\App\Extensions\TitanMapsIntelligence\System\TitanApps\ProviderInterfaceContributionCatalog::class], 'titan.apps.interface-contributions');

        $this->mergeConfigFrom(__DIR__.'/../config/titan_maps_intelligence.php', 'extensions.titan_maps_intelligence');
        $this->bindPreferred(AuthorisedCompanyContext::class, 'App\\Titan\\Maps\\MapsCompanyContext', RequestAuthorisedCompanyContext::class, 'scoped');
        $this->bindPreferred(PermissionAuthorizer::class, 'App\\Titan\\Maps\\MapsPermissionGateway', GatePermissionAuthorizer::class, 'scoped');
        $this->app->scoped(AdminPermissionAuthorizer::class, GateAdminPermissionAuthorizer::class);
        $this->app->scoped(QueueTenantContext::class, InMemoryQueueTenantContext::class);
        $this->bindPreferred(SecretResolver::class, 'App\\Titan\\Maps\\MapsCredentialResolver', EnvironmentSecretResolver::class, 'bind');
        $this->bindPreferred(AuditRecorder::class, 'App\\Titan\\Maps\\MapsAuditGateway', LogAuditRecorder::class, 'bind');
        $this->bindPreferred(CapabilityRegistrar::class, 'App\\Titan\\Maps\\MapsCapabilityRegistrar', LocalCapabilityRegistrar::class, 'singleton');
        $this->bindPreferred(WorkCoreCandidateGateway::class, 'App\\Titan\\Maps\\MapsWorkCoreGateway', UnavailableWorkCoreGateway::class, 'scoped');
        $this->bindPreferred(WorkCoreCandidateLookup::class, 'App\\Titan\\Maps\\MapsWorkCoreGateway', UnavailableWorkCoreGateway::class, 'scoped');
        $this->app->scoped(FieldSpatialPeerGateway::class, FieldSpatialPeerService::class);
        $this->app->scoped(FieldRouteOptimizationProposalService::class);
        $this->app->scoped(OfflineWorkerLocationSyncService::class);
        $this->app->scoped(NearestResourceService::class);
        $this->app->scoped(FieldReferenceGateway::class, function ($app): FieldReferenceGateway {
            $fieldProvider = 'App\\Extensions\\TitanField\\System\\TitanFieldServiceProvider';
            $fieldCommandGateway = 'App\\Extensions\\TitanField\\System\\Contracts\\FieldCommandGateway';
            $fieldActive = class_exists($fieldProvider) && interface_exists($fieldCommandGateway) && $app->bound($fieldCommandGateway);
            return $fieldActive ? $app->make(TitanFieldReferenceGateway::class) : $app->make(WorkCoreFieldReferenceGateway::class);
        });
        $this->bindPreferred(WorkerIdentityResolver::class, 'App\\Titan\\Maps\\MapsWorkerIdentityResolver', AuthenticatedWorkerIdentityResolver::class, 'scoped');
        $this->bindPreferred(PrivateExportStore::class, 'App\\Titan\\Maps\\MapsPrivateExportStore', LocalPrivateExportStore::class, 'scoped');
        $this->app->bind(ProviderHttpTransport::class, LaravelProviderHttpTransport::class);
        $this->app->bind(CandidateRepository::class, EloquentCandidateRepository::class);
        $this->app->singleton(PlacesProviderRegistry::class);
        $this->app->singleton(GeocodingProviderRegistry::class);
        $this->app->singleton(RoutingProviderRegistry::class);
        $this->app->singleton(TrafficProviderRegistry::class);
        $this->app->singleton(MapsConfiguration::class, static fn ($app): MapsConfiguration => new MapsConfiguration(
            (array) $app['config']->get('extensions.titan_maps_intelligence', []),
        ));
        $this->app->scoped(WorkerQualificationGateway::class, function ($app): WorkerQualificationGateway {
            $configured = $app['config']->get('extensions.titan_maps_intelligence.dispatch_intelligence.worker_qualification_resolver');
            if (is_string($configured) && class_exists($configured) && is_a($configured, WorkerQualificationGateway::class, true)) {
                return $app->make($configured);
            }
            $fieldProvider = 'App\\Extensions\\TitanField\\System\\TitanFieldServiceProvider';
            $fieldCommandGateway = 'App\\Extensions\\TitanField\\System\\Contracts\\FieldCommandGateway';
            $fieldActive = class_exists($fieldProvider) && interface_exists($fieldCommandGateway) && $app->bound($fieldCommandGateway);
            return $fieldActive ? $app->make(TitanFieldWorkerQualificationGateway::class) : $app->make(UnknownWorkerQualificationGateway::class);
        });
        $this->app->scoped(DispatchEvidenceGateway::class, function ($app): DispatchEvidenceGateway {
            $fieldProvider = 'App\\Extensions\\TitanField\\System\\TitanFieldServiceProvider';
            $fieldCommandGateway = 'App\\Extensions\\TitanField\\System\\Contracts\\FieldCommandGateway';
            $fieldActive = class_exists($fieldProvider) && interface_exists($fieldCommandGateway) && $app->bound($fieldCommandGateway);
            return $fieldActive ? $app->make(TitanFieldDispatchEvidenceGateway::class) : $app->make(CrmDispatchEvidenceGateway::class);
        });
        $this->app->scoped(DispatchAssignmentGateway::class, function ($app): DispatchAssignmentGateway {
            $fieldProvider = 'App\\Extensions\\TitanField\\System\\TitanFieldServiceProvider';
            $fieldCommandGateway = 'App\\Extensions\\TitanField\\System\\Contracts\\FieldCommandGateway';
            if (class_exists($fieldProvider) && interface_exists($fieldCommandGateway) && $app->bound($fieldCommandGateway)) return $app->make(TitanFieldDispatchAssignmentGateway::class);
            $hostClass = 'App\\Titan\\Maps\\MapsDispatchAssignmentGateway';
            return class_exists($hostClass) && is_a($hostClass, DispatchAssignmentGateway::class, true) ? $app->make($hostClass) : $app->make(CrmDispatchAssignmentGateway::class);
        });
        $this->app->scoped(GeographicPricingSignalProvider::class, ServiceTerritoryService::class);
        $this->app->scoped(SpatialExecutionContextStore::class);
        $this->bindPreferred(SpatialRiskGateway::class, 'App\Titan\Risk\MapsSpatialRiskGateway', UnavailableSpatialRiskGateway::class, 'scoped');
        $this->bindPreferred(SpatialAssuranceGateway::class, 'App\Titan\Assurance\MapsSpatialAssuranceGateway', UnavailableSpatialAssuranceGateway::class, 'scoped');
        $this->bindPreferred(SpatialAutonomyGateway::class, 'App\Titan\Autonomy\MapsSpatialAutonomyGateway', UnavailableSpatialAutonomyGateway::class, 'scoped');
        $this->bindPreferred(SpatialCommandBusGateway::class, 'App\Titan\CommandBus\MapsSpatialCommandBusGateway', UnavailableSpatialCommandBusGateway::class, 'scoped');
        $this->bindPreferred(SpatialSignalPublisher::class, 'App\Titan\Signal\MapsSpatialSignalPublisher', LocalSpatialSignalPublisher::class, 'scoped');
        $this->bindPreferred(SpatialRewindRecorder::class, 'App\Titan\Rewind\MapsSpatialRewindRecorder', LocalSpatialRewindRecorder::class, 'scoped');
        $this->bindPreferred(SpatialKnowledgeGateway::class, 'App\Titan\KnowledgeAuthority\MapsSpatialKnowledgeGateway', UnavailableSpatialKnowledgeGateway::class, 'scoped');
        $this->app->singleton(DispatchScoreService::class, static fn ($app): DispatchScoreService => new DispatchScoreService(
            $app->make(MapsConfiguration::class)->dispatchWeights(),
        ));
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'titan-maps-intelligence');
        $this->loadTranslationsFrom(__DIR__.'/../resources/lang', 'titan-maps-intelligence');
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        // Resolve once during boot so invalid algorithm/provider settings fail closed before routes or tools register.
        $this->app->make(MapsConfiguration::class);

        $required = new RequiredHostContract(fn (string $contract): mixed => $this->app->make($contract));
        foreach ([
            AuthorisedCompanyContext::class,
            PermissionAuthorizer::class,
            SecretResolver::class,
            AuditRecorder::class,
            CapabilityRegistrar::class,
            WorkCoreCandidateGateway::class,
            WorkCoreCandidateLookup::class,
            PrivateExportStore::class,
            WorkerIdentityResolver::class,
            FieldSpatialPeerGateway::class,
        ] as $contract) {
            $required->assertBound($contract, fn (string $requiredContract): bool => $this->app->bound($requiredContract));
        }

        $this->registerProviders();
        $this->registerCapabilities($required->resolve(CapabilityRegistrar::class));
        Gate::policy(DiscoverySearch::class, DiscoverySearchPolicy::class);
        Gate::policy(DiscoveryCandidate::class, DiscoveryCandidatePolicy::class);
        $this->registerRoutes();
        if ($this->app->runningInConsole()) {
            $this->commands([PruneWorkerLocationPingsCommand::class, ProcessGeofencesCommand::class, EscalateResourceFallbacksCommand::class]);
        }
        $this->app->afterResolving(Schedule::class, static function (Schedule $schedule): void {
            $schedule->command('titan-maps:process-geofences --minutes=5')->everyMinute()->withoutOverlapping();
            $schedule->command('titan-maps:escalate-resource-fallbacks')->everyFiveMinutes()->withoutOverlapping();
            $schedule->command('titan-maps:prune-location-pings')->hourly()->withoutOverlapping();
        });
    }

    public function registerKey(): string
    {
        return 'titan-maps-intelligence';
    }

    public static function uninstall(): void
    {
        // Idempotent lifecycle: tenant data is retained; forward-only schema migrations are never rolled back.
        // Navigation is extension-owned host state and should disappear when the extension is uninstalled.
        try {
            MapsMenuInstaller::deactivate();
        } catch (\Throwable) {
            // Uninstall must remain safe even if the host menu table/service is unavailable.
        }
    }

    private function bindPreferred(string $contract, string $hostClass, string $fallbackClass, string $lifetime): void
    {
        $implementation = class_exists($hostClass) && is_a($hostClass, $contract, true) ? $hostClass : $fallbackClass;

        match ($lifetime) {
            'singleton' => $this->app->singleton($contract, $implementation),
            'scoped' => $this->app->scoped($contract, $implementation),
            default => $this->app->bind($contract, $implementation),
        };
    }

    private function registerRoutes(): void
    {
        /** @var Router $router */
        $router = $this->app['router'];

        $router->aliasMiddleware('titan.maps.reject-company-override', RejectClientCompanyOverride::class);
        $router->aliasMiddleware('titan.maps.permission', RequireMapsPermission::class);
        $router->aliasMiddleware('titan.maps.admin', RequireMapsAdminPermission::class);
        $router->aliasMiddleware('titan.maps.internal', RequireMapsInternalRequest::class);
        $router->aliasMiddleware('titan.maps.bind-company-models', ResolveCompanyScopedRouteBindings::class);
        $router->aliasMiddleware('titan.maps.company', ResolveMapsCompanyContext::class);

        // beta.1 used a host-global `titan.company` alias. A Laravel route cache built
        // before beta.1.1 can retain that literal middleware name after the extension
        // source is upgraded. Preserve a host-owned alias when present; otherwise add
        // an extension fallback so stale cached Maps routes can resolve safely.
        $middlewareAliases = $router->getMiddleware();
        if (! isset($middlewareAliases['titan.company'])) {
            $router->aliasMiddleware('titan.company', ResolveMapsCompanyContext::class);
        }

        $router->group([
            'middleware' => ['web', 'auth', 'titan.maps.reject-company-override', 'titan.maps.company', 'titan.maps.bind-company-models'],
            'prefix' => 'dashboard/user/titan-maps-intelligence',
            'as' => 'dashboard.user.titan-maps-intelligence.',
        ], static function (): void {
            require __DIR__.'/../routes/user.php';
        });

        $router->group([
            'middleware' => ['web', 'auth', 'admin', 'titan.maps.admin:titan-maps-intelligence.admin.access'],
            'prefix' => 'dashboard/admin/titan-maps-intelligence',
            'as' => 'dashboard.admin.titan-maps-intelligence.',
        ], static function (): void {
            require __DIR__.'/../routes/admin.php';
        });

        $router->group([
            'middleware' => ['api', 'auth:sanctum', 'titan.maps.reject-company-override', 'titan.maps.company', 'titan.maps.bind-company-models'],
            'prefix' => 'api/titan/maps-intelligence',
            'as' => 'titan-maps-intelligence.',
        ], static function (): void {
            require __DIR__.'/../routes/api.php';
        });

        $router->group([
            'middleware' => ['api', 'titan.maps.internal'],
            'prefix' => 'internal/titan/maps-intelligence',
            'as' => 'internal.titan-maps-intelligence.',
        ], static function (): void {
            require __DIR__.'/../routes/internal.php';
        });
    }

    private function registerProviders(): void
    {
        $places = $this->app->make(PlacesProviderRegistry::class);
        $places->registerFactory('google-places', function (?string $companyId): GooglePlacesProvider {
            [$connection, $config] = $this->resolveProviderConnection($companyId, 'google-places');
            $config['credential_reference'] = $this->app->make(ProviderHealthService::class)->credentialReference($connection);
            return new GooglePlacesProvider(
                $this->app->make(ProviderHttpTransport::class),
                $this->app->make(SecretResolver::class),
                $config,
                $this->app->make(GooglePlacesNormalizer::class),
            );
        });

        $geocoding = $this->app->make(GeocodingProviderRegistry::class);
        $geocoding->registerFactory('google-geocoding', function (?string $companyId): GoogleGeocodingProvider {
            [$connection, $config] = $this->resolveProviderConnection($companyId, 'google-geocoding');
            $config['credential_reference'] = $this->app->make(ProviderHealthService::class)->credentialReference($connection);
            return new GoogleGeocodingProvider(
                $this->app->make(ProviderHttpTransport::class),
                $this->app->make(SecretResolver::class),
                $config,
            );
        });

        $routeFactory = function (?string $companyId): GoogleRoutesProvider {
            [$connection, $config] = $this->resolveProviderConnection($companyId, 'google-routes');
            $config['credential_reference'] = $this->app->make(ProviderHealthService::class)->credentialReference($connection);
            return new GoogleRoutesProvider(
                $this->app->make(ProviderHttpTransport::class),
                $this->app->make(SecretResolver::class),
                $config,
                $this->app->make(GoogleDurationParser::class),
            );
        };
        $this->app->make(RoutingProviderRegistry::class)->registerFactory('google-routes', $routeFactory);
        $this->app->make(TrafficProviderRegistry::class)->registerFactory('google-routes', $routeFactory);
    }

    /** @return array{0: MapProviderConnection, 1: array} */
    private function resolveProviderConnection(?string $companyId, string $provider): array
    {
        if ($companyId === null || trim($companyId) === '') {
            throw ProviderException::fromCode('MAPS_TENANT_DENIED', 'A company context is required to resolve a maps provider.');
        }
        $connection = MapProviderConnection::query()
            ->where('company_id', $companyId)
            ->where('provider', $provider)
            ->where('enabled', true)
            ->first();
        if ($connection === null) {
            throw ProviderException::fromCode('MAPS_PROVIDER_NOT_CONFIGURED', 'The requested maps provider is not configured for the authorised company.', ['provider' => $provider]);
        }
        $configuration = $this->app->make(MapsConfiguration::class);
        $config = $configuration->providerConfig($provider, (array) ($connection->configuration ?? []));
        return [$connection, $config];
    }

    private function registerCapabilities(CapabilityRegistrar $registrar): void
    {
        foreach ($this->app->make(MapsCapabilityService::class)->definitions() as $definition) {
            $registrar->register($definition);
        }
    }
}
