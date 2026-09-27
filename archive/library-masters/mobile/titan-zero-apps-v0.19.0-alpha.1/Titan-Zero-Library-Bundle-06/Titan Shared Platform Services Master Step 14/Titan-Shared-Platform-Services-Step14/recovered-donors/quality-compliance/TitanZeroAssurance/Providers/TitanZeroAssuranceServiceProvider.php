<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\TitanZeroAssurance\Contracts\CompanyExecutionContextProvider;
use Modules\TitanZeroAssurance\Contracts\AuditEventStore;
use Modules\TitanZeroAssurance\Contracts\WorkItemDispatcher;
use Modules\TitanZeroAssurance\Services\AuthorityPolicy;
use Modules\TitanZeroAssurance\Services\CapabilityRegistry;
use Modules\TitanZeroAssurance\Services\ExecutionContextStore;
use Modules\TitanZeroAssurance\Services\EloquentAuditEventStore;
use Modules\TitanZeroAssurance\Services\AuditBackbone;
use Modules\TitanZeroAssurance\Services\RuleBasedAssuranceHandler;
use Modules\TitanZeroAssurance\Services\AssuranceOrchestrator;
use Modules\TitanZeroAssurance\Services\AssuranceSignals;
use Modules\TitanZeroAssurance\Services\AssuranceHandlerRegistry;
use Modules\TitanZeroAssurance\Services\GovernedWorkItemRouter;
use Modules\TitanZeroAssurance\Services\EloquentWorkItemDispatcher;

final class TitanZeroAssuranceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../Config/assurance.php', 'titan_zero_assurance');
        $this->mergeConfigFrom(__DIR__ . '/../Config/titanzero.php', 'titan_zero_assurance_titanzero');
        $this->mergeConfigFrom(__DIR__ . '/../manifests/contracts.php', 'titan_zero_assurance_contracts');

        $this->app->singleton(ExecutionContextStore::class);
        $this->app->alias(ExecutionContextStore::class, CompanyExecutionContextProvider::class);
        $this->app->singleton(AuthorityPolicy::class);
        $this->app->singleton(CapabilityRegistry::class);
        $this->app->singleton(EloquentAuditEventStore::class);
        $this->app->alias(EloquentAuditEventStore::class, AuditEventStore::class);
        $this->app->singleton(AuditBackbone::class);
        $this->app->singleton(EloquentWorkItemDispatcher::class);
        $this->app->alias(EloquentWorkItemDispatcher::class, WorkItemDispatcher::class);
        $this->app->singleton(GovernedWorkItemRouter::class);
        $this->app->singleton(AssuranceHandlerRegistry::class, function () { $r = new AssuranceHandlerRegistry(); $r->register(app(RuleBasedAssuranceHandler::class)); return $r; });
        $this->app->singleton(RuleBasedAssuranceHandler::class);
        $this->app->singleton(AssuranceSignals::class);
        $this->app->singleton(AssuranceOrchestrator::class, fn ($app) => new AssuranceOrchestrator($app->make(AuditBackbone::class), $app->make(GovernedWorkItemRouter::class), $app->make(AssuranceHandlerRegistry::class)));
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        $registry = $this->app->make(CapabilityRegistry::class);
        $registry->registerModuleFromArray(
            'TitanZeroAssurance',
            (array) config('titan_zero_assurance_titanzero.capabilities', []),
        );
    }
}
