<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System;

use App\Extensions\TitanHub\System\Contracts\CustomerOperationsGateway;
use App\Extensions\TitanHub\System\Contracts\HubContributionRegistry;
use App\Extensions\TitanHub\System\Contracts\HubPresentationBridge;
use App\Extensions\TitanHub\System\Contracts\TrustedCustomerContextResolver;
use App\Extensions\TitanHub\System\Context\RequestTrustedCustomerContextResolver;
use App\Extensions\TitanHub\System\Health\HubHealthCheck;
use App\Extensions\TitanHub\System\Http\Middleware\ResolveHubCustomerContext;
use App\Extensions\TitanHub\System\Integration\HubProviderIntegrationRegistrar;
use App\Extensions\TitanHub\System\Operations\AggregatingCustomerOperationsGateway;
use App\Extensions\TitanHub\System\Operations\InMemoryHubContributionRegistry;
use App\Extensions\TitanHub\System\Presentation\AdaptiveHubPresentationBridge;
use App\Extensions\TitanHub\System\Presentation\HubWorkspaceSpecFactory;
use App\Extensions\TitanHub\System\Integration\HubSuiteReadiness;
use App\Extensions\TitanHub\System\Integration\HubCapabilityDiscovery;
use App\Extensions\TitanHub\System\Security\HubProjectionGuard;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;

final class TitanHubServiceProvider extends ServiceProvider
{
    public function register():void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/hub.php','hub');
        $this->app->singleton(HubContributionRegistry::class,InMemoryHubContributionRegistry::class);
        $this->app->singleton(CustomerOperationsGateway::class,fn($app)=>new AggregatingCustomerOperationsGateway($app->make(HubContributionRegistry::class)));
        $this->app->singleton(TrustedCustomerContextResolver::class,RequestTrustedCustomerContextResolver::class);
        $this->app->singleton(HubWorkspaceSpecFactory::class);
        $this->app->singleton(HubPresentationBridge::class,AdaptiveHubPresentationBridge::class);
        $this->app->singleton(HubProjectionGuard::class);
        $this->app->singleton(HubHealthCheck::class);
        $this->app->singleton(HubProviderIntegrationRegistrar::class);
        $this->app->singleton(HubSuiteReadiness::class);
        $this->app->singleton(HubCapabilityDiscovery::class);
    }

    public function boot(Router $router):void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views','titan-hub');
        $router->aliasMiddleware('titan.hub.context',ResolveHubCustomerContext::class);
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        $this->publishes([__DIR__.'/../config/hub.php'=>config_path('hub.php')],'titan-hub-config');
        $this->app->booted(function():void{ try{$this->app->make(HubProviderIntegrationRegistrar::class)->register();}catch(\Throwable $e){report($e);} });
    }
}
