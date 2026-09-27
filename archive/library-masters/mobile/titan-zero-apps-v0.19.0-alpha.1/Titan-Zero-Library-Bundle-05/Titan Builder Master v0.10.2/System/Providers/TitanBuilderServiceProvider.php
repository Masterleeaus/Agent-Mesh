<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Providers;

use App\Extensions\TitanBuilder\System\Services\TitanZeroDashboardService;
use App\Extensions\TitanBuilder\System\Services\DashboardBuilderService;
use App\Extensions\TitanBuilder\System\Services\DashboardBuilderServiceV2;
use App\Extensions\TitanBuilder\System\Services\GrapesJsIntegrationService;
use Illuminate\Support\ServiceProvider;

/**
 * TitanBuilder Service Provider
 * 
 * Registers all dashboard builder services:
 * - TitanZeroDashboardService (recommended - TitanZero-specific)
 * - DashboardBuilderService (3 Code 2.0 templates)
 * - DashboardBuilderServiceV2 (12 Code 2.0 templates)
 * - GrapesJsIntegrationService (visual editor)
 */
class TitanBuilderServiceProvider extends ServiceProvider
{
    /**
     * Register services into container
     */
    public function register(): void
    {
        // Register all dashboard services
        $this->app->singleton(TitanZeroDashboardService::class, function ($app) {
            return new TitanZeroDashboardService();
        });

        $this->app->singleton(DashboardBuilderService::class, function ($app) {
            return new DashboardBuilderService();
        });

        $this->app->singleton(DashboardBuilderServiceV2::class, function ($app) {
            return new DashboardBuilderServiceV2();
        });

        $this->app->singleton(GrapesJsIntegrationService::class, function ($app) {
            return new GrapesJsIntegrationService();
        });

        // Alias TitanZeroDashboardService as default dashboard builder
        // (can be overridden in config)
        $default = config('dashboard-builder.default_service', 'titanzer');
        
        if ($default === 'titanzer') {
            $this->app->alias(TitanZeroDashboardService::class, 'dashboard-builder');
        } elseif ($default === 'v2') {
            $this->app->alias(DashboardBuilderServiceV2::class, 'dashboard-builder');
        } else {
            $this->app->alias(DashboardBuilderService::class, 'dashboard-builder');
        }
    }

    /**
     * Boot services
     */
    public function boot(): void
    {
        // Publish config
        $this->publishes([
            __DIR__ . '/../../config/dashboard-builder.php' => config_path('dashboard-builder.php'),
        ], 'dashboard-builder-config');
    }
}
