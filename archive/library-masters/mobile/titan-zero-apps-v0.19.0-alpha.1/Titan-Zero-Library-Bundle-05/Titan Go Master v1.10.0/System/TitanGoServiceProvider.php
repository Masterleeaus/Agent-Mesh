<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System;

use Illuminate\Support\ServiceProvider;
use App\Extensions\TitanGo\System\Contracts\GoRuntimeBridgeInterface;
use App\Extensions\TitanGo\System\Contracts\GoActionIntentGatewayInterface;
use App\Extensions\TitanGo\System\Contracts\TitanFieldMobileGatewayInterface;
use App\Extensions\TitanGo\System\Contracts\GoSuiteRuntimeInterface;
use App\Extensions\TitanGo\System\Runtime\GoRuntimeBridge;
use App\Extensions\TitanGo\System\Runtime\GoRuntimeReadiness;
use App\Extensions\TitanGo\System\Runtime\GoSuiteRuntime;
use App\Extensions\TitanGo\System\Runtime\GoBootstrap;
use App\Extensions\TitanGo\System\Integration\TitanFieldMobileGateway;
use App\Extensions\TitanGo\System\Integration\InteractionEngineGoActionIntentGateway;
use App\Extensions\TitanGo\System\Navigation\GoNavigation;
use App\Extensions\TitanGo\System\Health\GoHealthCheck;
use App\Extensions\TitanGo\System\Offline\GoOfflineReplayPolicy;
use App\Extensions\TitanGo\System\Offline\DeviceQueueEnvelopeFactory;
use App\Extensions\TitanGo\System\Offline\GoOfflineBatchEnvelopeFactory;

final class TitanGoServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/titan-go.php', 'titan-go');
        $this->app->singleton(GoRuntimeBridgeInterface::class, GoRuntimeBridge::class);
        $this->app->singleton(GoActionIntentGatewayInterface::class, InteractionEngineGoActionIntentGateway::class);
        $this->app->singleton(TitanFieldMobileGatewayInterface::class, TitanFieldMobileGateway::class);
        $this->app->singleton(GoSuiteRuntimeInterface::class, GoSuiteRuntime::class);
        $this->app->singleton(GoNavigation::class);
        $this->app->singleton(GoRuntimeReadiness::class);
        $this->app->singleton(GoBootstrap::class);
        $this->app->singleton(GoOfflineReplayPolicy::class);
        $this->app->singleton(DeviceQueueEnvelopeFactory::class);
        $this->app->singleton(GoOfflineBatchEnvelopeFactory::class);
        $this->app->singleton(GoHealthCheck::class);
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'titan-go');
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
    }

    public function registerKey(): string
    {
        return 'titan-go';
    }

    public static function uninstall(): void
    {
        // Go owns no business/domain tables. Device-local app state is outside
        // server-side extension uninstall and provider truth remains untouched.
    }
}
