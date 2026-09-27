<?php

namespace Modules\QualityControl\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Modules\QualityControl\Console\Commands\AutoCreateRecurringSchedules;
use Modules\QualityControl\Console\Commands\ActivateQualityControlModuleCommand;
use Modules\QualityControl\Listeners\JobCompletedListener;
use Modules\QualityControl\Services\ExecutionRecordService;
use Modules\QualityControl\Services\ScheduleService;
use Modules\QualityControl\Services\TemplateService;
use Modules\QualityControl\Services\QualityReportService;

class QualityControlServiceProvider extends ServiceProvider
{
    protected string $moduleName = 'QualityControl';

    public function register(): void
    {
        $this->registerConfig();
        $this->registerCommands();
        $this->app->singleton(ExecutionRecordService::class);
        $this->app->singleton(TemplateService::class);
        $this->app->singleton(ScheduleService::class);
        $this->app->singleton(QualityReportService::class);
    }

    public function boot(): void
    {
        $this->registerTranslations();
        $this->registerViews();
        $this->registerSidebarHints();
        $this->scheduleCommands();

        // Optional: auto-create Quality Checks when a job is completed.
        if (config('quality_control.auto_create_on_job_complete', false)) {
            $listener = app(JobCompletedListener::class);

            // String events (loose coupling) — other modules can dispatch these.
            Event::listen('job.completed', [$listener, 'handle']);
            Event::listen('cleaning.job.completed', [$listener, 'handle']);
            Event::listen('jobs.completed', [$listener, 'handle']);
        }
    
        // Titan Zero + Titan Go integration (legacy host capability registry).
        if (class_exists(\Modules\TitanZero\Services\CapabilityRegistry::class)) {
            \Modules\TitanZero\Services\CapabilityRegistry::registerModuleFromConfig('QualityControl');
        }

        // Pass 1 canonical assurance registry. This remains optional so QualityControl can boot
        // on legacy hosts while newer hosts get normalized risk/capability definitions.
        if (class_exists(\Modules\TitanZeroAssurance\Services\CapabilityRegistry::class)) {
            try {
                app(\Modules\TitanZeroAssurance\Services\CapabilityRegistry::class)
                    ->registerModuleFromArray('QualityControl', (array) config('quality_control_titanzero.capabilities', []));
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }

    protected function registerConfig(): void
    {
        // module config.php (if present)
        $this->publishes([
            __DIR__ . '/../Config/config.php' => config_path('quality_control.php'),
        ], 'config');

        $this->mergeConfigFrom(__DIR__ . '/../Config/config.php', 'quality_control');

        // integrations (Titan link-outs only)
        $this->publishes([
            __DIR__ . '/../Config/integrations.php' => config_path('quality_control_integrations.php'),
        ], 'config');

        $this->mergeConfigFrom(__DIR__ . '/../Config/integrations.php', 'quality_control_integrations');

        $this->publishes([
            __DIR__ . '/../Config/module_settings.php' => config_path('quality_control_module_settings.php'),
        ], 'config');

        $this->mergeConfigFrom(__DIR__ . '/../Config/module_settings.php', 'quality_control_module_settings');

        $this->publishes([
            __DIR__ . '/../Config/titanzero.php' => config_path('quality_control_titanzero.php'),
        ], 'config');

        $this->mergeConfigFrom(__DIR__ . '/../Config/titanzero.php', 'quality_control_titanzero');

        $this->mergeConfigFrom(__DIR__ . '/../manifests/permissions.php', 'quality_control_manifest_permissions');
        $this->mergeConfigFrom(__DIR__ . '/../manifests/settings.php', 'quality_control_manifest_settings');
        $this->mergeConfigFrom(__DIR__ . '/../manifests/api.php', 'quality_control_manifest_api');
        $this->mergeConfigFrom(__DIR__ . '/../manifests/lifecycle.php', 'quality_control_manifest_lifecycle');
        $this->mergeConfigFrom(__DIR__ . '/../manifests/signals.php', 'quality_control_manifest_signals');
        $this->mergeConfigFrom(__DIR__ . '/../manifests/seeders.php', 'quality_control_manifest_seeders');
        $this->mergeConfigFrom(__DIR__ . '/../manifests/ai.php', 'quality_control_manifest_ai');
    }

    protected function registerTranslations(): void
    {
        $langPath = resource_path('lang/modules/' . strtolower($this->moduleName));

        if (is_dir($langPath)) {
            $this->loadTranslationsFrom($langPath, 'quality_control');
            $this->loadTranslationsFrom($langPath, 'inspection');
        } else {
            $this->loadTranslationsFrom(__DIR__ . '/../Resources/lang', 'quality_control');
            $this->loadTranslationsFrom(__DIR__ . '/../Resources/lang', 'inspection');
        }
    }

    protected function registerViews(): void
    {
        $this->loadViewsFrom(__DIR__ . '/../Resources/views', 'quality_control');
        $this->loadViewsFrom(__DIR__ . '/../Resources/views', 'inspection');

        $this->publishes([
            __DIR__ . '/../Resources/views' => resource_path('views/modules/' . strtolower($this->moduleName)),
        ], 'views');
    }

    protected function registerCommands(): void
    {
        $this->commands([
            AutoCreateRecurringSchedules::class,
            ActivateQualityControlModuleCommand::class,
        ]);
    }

    protected function scheduleCommands(): void
    {
        // Worksuite commonly defines app.cron_timezone; fall back to app.timezone.
        $timezone = config('app.cron_timezone') ?: config('app.timezone', 'UTC');

        /** @var Schedule $schedule */
        $schedule = $this->app->make(Schedule::class);

        $schedule->command('recurring-schedule-create')
            ->daily()
            ->timezone($timezone);
    }

protected function registerSidebarHints(): void
{
        View::share('qualityControlSidebarView', 'quality_control::sections.sidebar');
        View::share('inspectionSidebarView', 'quality_control::sections.sidebar');
        View::share('qualityControlModuleAlias', config('quality_control_module_settings.module_alias', 'quality_control'));
        View::share('inspectionModuleAlias', 'inspections');
}

}
