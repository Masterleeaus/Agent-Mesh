<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System;

use Illuminate\Support\ServiceProvider;
use App\Extensions\TitanVisualRuntime\System\Contracts\{
    VisualRuntime,VisualCapabilityRegistry,VisualCapabilityNegotiator,VisualContributionRegistry,
    VisualResourceRegistry,VisualFallbackPlanner,AssetResolver,IconResolver,MediaResolver,
    VisualResourceIntegrityVerifier,VisualOfflineCachePlanner,VisualMetadataContract,
    VisualStateTransitionPlanner,VisualContributionResolver,VisualContributionSnapshot,
    VisualContributionVersionPolicy,VisualResourceFreshnessPolicy,VisualCapabilityDegradationPlanner,
    InterfaceRuntimeBridgeCompatibility,VisualRuntimeHealth,VisualRuntimeCompatibilityNegotiator
};
use App\Extensions\TitanVisualRuntime\System\Runtime\{
    AdaptiveVisualRuntime,DefaultVisualCapabilityRegistry,DefaultVisualCapabilityNegotiator,
    DeterministicVisualFallbackPlanner,InMemoryVisualContributionRegistry,InMemoryVisualResourceRegistry,
    RoleAssetResolver,RoleIconResolver,RoleMediaResolver,VisualMetadataGuard,
    Sha256VisualResourceIntegrityVerifier,DeterministicVisualOfflineCachePlanner,
    DefaultVisualMetadataContract,DeterministicVisualStateTransitionPlanner,
    DeterministicVisualContributionResolver,DeterministicVisualContributionSnapshot,
    SemanticVisualContributionVersionPolicy,DefaultVisualResourceFreshnessPolicy,
    DeterministicVisualCapabilityDegradationPlanner,DefaultInterfaceRuntimeBridgeCompatibility,
    DefaultVisualRuntimeHealth,DefaultVisualRuntimeCompatibilityNegotiator
};

final class TitanVisualRuntimeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/titan-visual-runtime.php','titan-visual-runtime');
        $this->app->singleton(VisualMetadataGuard::class);
        $this->app->singleton(VisualCapabilityRegistry::class,DefaultVisualCapabilityRegistry::class);
        $this->app->singleton(VisualCapabilityNegotiator::class,DefaultVisualCapabilityNegotiator::class);
        $this->app->singleton(VisualFallbackPlanner::class,DeterministicVisualFallbackPlanner::class);
        $this->app->singleton(VisualContributionRegistry::class,InMemoryVisualContributionRegistry::class);
        $this->app->singleton(InMemoryVisualResourceRegistry::class);
        $this->app->alias(InMemoryVisualResourceRegistry::class,VisualResourceRegistry::class);
        $this->app->singleton(AssetResolver::class,RoleAssetResolver::class);
        $this->app->singleton(IconResolver::class,RoleIconResolver::class);
        $this->app->singleton(MediaResolver::class,RoleMediaResolver::class);
        $this->app->singleton(VisualResourceIntegrityVerifier::class,Sha256VisualResourceIntegrityVerifier::class);
        $this->app->singleton(VisualOfflineCachePlanner::class,DeterministicVisualOfflineCachePlanner::class);
        $this->app->singleton(VisualMetadataContract::class,DefaultVisualMetadataContract::class);
        $this->app->singleton(VisualStateTransitionPlanner::class,DeterministicVisualStateTransitionPlanner::class);
        $this->app->singleton(VisualContributionResolver::class,DeterministicVisualContributionResolver::class);
        $this->app->singleton(VisualContributionSnapshot::class,DeterministicVisualContributionSnapshot::class);
        $this->app->singleton(VisualContributionVersionPolicy::class,SemanticVisualContributionVersionPolicy::class);
        $this->app->singleton(VisualResourceFreshnessPolicy::class,DefaultVisualResourceFreshnessPolicy::class);
        $this->app->singleton(VisualCapabilityDegradationPlanner::class,DeterministicVisualCapabilityDegradationPlanner::class);
        $this->app->singleton(InterfaceRuntimeBridgeCompatibility::class,DefaultInterfaceRuntimeBridgeCompatibility::class);
        $this->app->singleton(VisualRuntimeHealth::class,DefaultVisualRuntimeHealth::class);
        $this->app->singleton(VisualRuntimeCompatibilityNegotiator::class,DefaultVisualRuntimeCompatibilityNegotiator::class);
        $this->app->singleton(VisualRuntime::class,AdaptiveVisualRuntime::class);
    }

    public function boot(): void
    {
        if($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/titan-visual-runtime.php'=>config_path('titan-visual-runtime.php')
            ],'titan-visual-runtime-config');
        }
    }
}
