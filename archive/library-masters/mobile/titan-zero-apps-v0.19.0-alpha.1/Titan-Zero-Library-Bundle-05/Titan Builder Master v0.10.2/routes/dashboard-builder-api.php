<?php

use App\Extensions\TitanBuilder\System\Http\Controllers\DashboardBuilderController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api', 'auth', 'company.context'])->prefix('api/builder')->group(function () {
    // Widget Registry Endpoints
    Route::get('/widgets', [DashboardBuilderController::class, 'widgetRegistry'])
        ->name('builder.widgets.registry');

    Route::get('/widgets/{widgetId}', [DashboardBuilderController::class, 'widgetDetails'])
        ->name('builder.widgets.details');

    // Template Endpoints
    Route::get('/templates', [DashboardBuilderController::class, 'templates'])
        ->name('builder.templates.list');

    Route::get('/templates/{templateId}', [DashboardBuilderController::class, 'templateDetails'])
        ->name('builder.templates.details');

    // Dashboard CRUD Endpoints
    Route::post('/projects/{project}/dashboards/from-template/{templateId}', [
        DashboardBuilderController::class,
        'createFromTemplate',
    ])->name('builder.dashboards.create-from-template');

    Route::post('/dashboards/validate-spec', [DashboardBuilderController::class, 'validateSpec'])
        ->name('builder.dashboards.validate-spec');

    Route::get('/dashboards/{pageId}/export', [DashboardBuilderController::class, 'exportDashboard'])
        ->name('builder.dashboards.export');

    Route::post('/projects/{project}/dashboards/import', [
        DashboardBuilderController::class,
        'importDashboard',
    ])->name('builder.dashboards.import');

    Route::post('/dashboards/{sourcePageId}/clone', [DashboardBuilderController::class, 'cloneDashboard'])
        ->name('builder.dashboards.clone');

    // Existing Page Editor Routes (Enhanced)
    Route::get('/pages/{pageId}', [
        \App\Extensions\TitanBuilder\System\Http\Controllers\PageController::class,
        'show',
    ])->name('builder.pages.show');

    Route::post('/pages/{pageId}/spec', [
        \App\Extensions\TitanBuilder\System\Http\Controllers\PageController::class,
        'saveSpec',
    ])->name('builder.pages.save-spec');

    Route::patch('/pages/{pageId}/spec/partial', [
        \App\Extensions\TitanBuilder\System\Http\Controllers\PageController::class,
        'updatePartial',
    ])->name('builder.pages.update-partial');

    Route::post('/projects/{project}/pages', [
        \App\Extensions\TitanBuilder\System\Http\Controllers\PageController::class,
        'store',
    ])->name('builder.pages.store');
});
