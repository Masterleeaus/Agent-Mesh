<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System;

use Illuminate\Support\ServiceProvider;

final class TitanAppsCoreServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Extensions\TitanAppsCore\System\Contracts\SuiteProductionGate::class, \App\Extensions\TitanAppsCore\System\Services\DeterministicSuiteProductionGate::class);
        $this->mergeConfigFrom(__DIR__.'/../config/titan-apps-core.php', 'titan-apps-core');

        $this->app->singleton(Services\TitanAppsRolePolicyService::class);
        $this->app->singleton(Services\PwaNativeSurfaceRegistry::class);
        $this->app->singleton(Services\TitanAppsModuleLibrary::class);
        $this->app->singleton(Services\TitanAppsNavigationService::class);
        $this->app->singleton(Services\AppWorkspaceSectionRegistry::class);
        $this->app->singleton(Services\AppRuntimeExperiencePolicy::class);
        $this->app->singleton(Services\AppOperatingTimelinePolicy::class);
        $this->app->singleton(Services\AppExecutionContinuityPolicy::class);
        $this->app->singleton(Services\AppMultimodalInputNormalizer::class);
        $this->app->singleton(Services\TitanAppsDiscoveryService::class);
        $this->app->singleton(Services\TitanAppsPwaLifecycleService::class);
        $this->app->singleton(Services\TitanAppsPwaManifestFactory::class);
        $this->app->singleton(Services\TitanAppsServiceWorkerFactory::class);
        $this->app->singleton(Services\TitanAppsApplicationRegistry::class);
        $this->app->singleton(Services\AppSurfaceAudienceResolver::class);
        $this->app->singleton(Services\TitanAppsRuntimeDependencyRegistry::class);
        $this->app->singleton(Services\AppTrustedContextNormalizer::class);
        $this->app->singleton(Services\TitanAppsLifecycleService::class);
        $this->app->singleton(Services\TitanAppsCoreReadinessValidator::class);
        $this->app->singleton(Services\TitanAppsCoreInstallReadiness::class);
        $this->app->singleton(Services\TitanAppsHostDiagnosticsService::class);
        $this->app->singleton(Services\TitanAppsGovernedDecisionSurface::class);
        $this->app->alias(Services\TitanAppsGovernedDecisionSurface::class, Contracts\GovernedDecisionSurface::class);
        $this->app->alias(Services\TitanAppsCoreInstallReadiness::class, Contracts\ExtensionInstallReadiness::class);
        $this->app->singleton(Services\TitanAppsPublicServiceRegistry::class);
        $this->app->alias(Services\TitanAppsPublicServiceRegistry::class, Contracts\PlatformAccessibleServiceRegistry::class);
        $this->app->singleton(Services\AppContextFactory::class);
        $this->app->alias(Services\TitanAppsLifecycleService::class, Contracts\AppLifecycle::class);
        $this->app->alias(Services\TitanAppsPwaLifecycleService::class, Contracts\AppPwaLifecycle::class);
        $this->app->singleton(Health\TitanAppsCoreHealthService::class);
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../config/titan-apps-core.php' => config_path('titan-apps-core.php'),
        ], 'titan-apps-core');
    }
}
