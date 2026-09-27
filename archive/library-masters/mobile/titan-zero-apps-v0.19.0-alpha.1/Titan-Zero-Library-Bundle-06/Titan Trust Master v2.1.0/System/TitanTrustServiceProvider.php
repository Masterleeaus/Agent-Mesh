<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System;

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;

class TitanTrustServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/titantrust.php', 'titantrust');
    }

    public function boot(Kernel $kernel): void
    {
        $this->registerTranslations();
        $this->registerViews();
        $this->registerRoutes();
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
        $this->registerMigrations();
    }

    protected function registerTranslations(): void
    {
        $this->loadTranslationsFrom(__DIR__ . '/../resources/lang', 'titantrust');
    }

    protected function registerViews(): void
    {
        $this->loadViewsFrom([__DIR__ . '/../resources/views'], 'titantrust');
    }

    protected function registerMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
    }

    protected function registerRoutes(): void
    {
        /** @var Router $router */
        $router = $this->app['router'];

        // Authenticated app routes (staff/manager)
        $router->group([
            'middleware' => ['web', 'auth'],
            'prefix' => 'dashboard/user/titan-trust',
            'as' => 'dashboard.user.titan-trust.',
        ], function (Router $router) {
            // Evidence
            $router->get('/', [\App\Extensions\TitanTrust\System\Http\Controllers\EvidenceController::class, 'index'])->name('index');
            $router->get('/create', [\App\Extensions\TitanTrust\System\Http\Controllers\EvidenceController::class, 'create'])->name('create');
            $router->get('/attach', [\App\Extensions\TitanTrust\System\Http\Controllers\EvidenceController::class, 'attach'])->name('attach');
            $router->post('/upload', [\App\Extensions\TitanTrust\System\Http\Controllers\EvidenceController::class, 'store'])->name('store');
            $router->get('/{id}', [\App\Extensions\TitanTrust\System\Http\Controllers\EvidenceController::class, 'show'])->whereNumber('id')->name('show');
            $router->delete('/{id}', [\App\Extensions\TitanTrust\System\Http\Controllers\EvidenceController::class, 'destroy'])->whereNumber('id')->name('destroy');

            // Rules (soft gating)
            $router->get('/rules', [\App\Extensions\TitanTrust\System\Http\Controllers\RulesController::class, 'index'])->name('rules.index');
            $router->get('/rules/create', [\App\Extensions\TitanTrust\System\Http\Controllers\RulesController::class, 'create'])->name('rules.create');
            $router->post('/rules', [\App\Extensions\TitanTrust\System\Http\Controllers\RulesController::class, 'store'])->name('rules.store');
            $router->get('/rules/{id}/edit', [\App\Extensions\TitanTrust\System\Http\Controllers\RulesController::class, 'edit'])->whereNumber('id')->name('rules.edit');
            $router->put('/rules/{id}', [\App\Extensions\TitanTrust\System\Http\Controllers\RulesController::class, 'update'])->whereNumber('id')->name('rules.update');
            $router->delete('/rules/{id}', [\App\Extensions\TitanTrust\System\Http\Controllers\RulesController::class, 'destroy'])->whereNumber('id')->name('rules.destroy');

            // Capture mode
            $router->get('/capture', [\App\Extensions\TitanTrust\System\Http\Controllers\CaptureController::class, 'index'])->name('capture.index');
            $router->post('/capture/upload', [\App\Extensions\TitanTrust\System\Http\Controllers\CaptureController::class, 'store'])->name('capture.store');

            // Presence
            $router->post('/attendance/arrived', [\App\Extensions\TitanTrust\System\Http\Controllers\PresenceController::class, 'markArrived'])->name('attendance.arrived');
            $router->post('/attendance/leaving', [\App\Extensions\TitanTrust\System\Http\Controllers\PresenceController::class, 'markLeaving'])->name('attendance.leaving');

            // Incidents
            $router->get('/incidents', [\App\Extensions\TitanTrust\System\Http\Controllers\IncidentController::class, 'index'])->name('incidents.index');
            $router->get('/incidents/create', [\App\Extensions\TitanTrust\System\Http\Controllers\IncidentController::class, 'create'])->name('incidents.create');
            $router->post('/incidents', [\App\Extensions\TitanTrust\System\Http\Controllers\IncidentController::class, 'store'])->name('incidents.store');
            $router->get('/incidents/{id}', [\App\Extensions\TitanTrust\System\Http\Controllers\IncidentController::class, 'show'])->whereNumber('id')->name('incidents.show');
            $router->post('/incidents/{id}/resolve', [\App\Extensions\TitanTrust\System\Http\Controllers\IncidentController::class, 'resolve'])->whereNumber('id')->name('incidents.resolve');

            // Client sign-off request (staff generates link)
            $router->get('/signoff/request', [\App\Extensions\TitanTrust\System\Http\Controllers\SignoffController::class, 'requestLink'])->name('signoff.request');
        });

        // Public client sign-off (token; no auth)
        $router->group([
            'middleware' => ['web'],
            'prefix' => 'evidence/signoff',
            'as' => 'titan-trust.public.signoff.',
        ], function (Router $router) {
            $router->get('/{token}', [\App\Extensions\TitanTrust\System\Http\Controllers\SignoffController::class, 'publicShow'])->name('show');
            $router->post('/{token}', [\App\Extensions\TitanTrust\System\Http\Controllers\SignoffController::class, 'publicStore'])->name('store');
            $router->get('/{token}/thanks', [\App\Extensions\TitanTrust\System\Http\Controllers\SignoffController::class, 'publicThanks'])->name('thanks');
        });
    }
}
