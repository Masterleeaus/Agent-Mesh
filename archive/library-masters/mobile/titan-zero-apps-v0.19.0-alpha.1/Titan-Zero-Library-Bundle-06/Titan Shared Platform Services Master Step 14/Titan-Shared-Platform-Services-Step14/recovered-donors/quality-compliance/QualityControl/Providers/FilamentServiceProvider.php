<?php

namespace Modules\QualityControl\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\QualityControl\Filament\Plugin\QualityControlPlugin;

final class FilamentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton('quality-control.filament.plugin', fn () => QualityControlPlugin::make());
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__ . '/../Resources/views', 'quality_control');
    }
}
