<?php

declare(strict_types=1);

use App\Extensions\TitanBuilder\System\Http\Controllers\Management\AdminManagementController;
use App\Extensions\TitanBuilder\System\Http\Controllers\Management\CompanyManagementController;
use App\Extensions\TitanBuilder\System\Http\Controllers\Management\ManagementSettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix((string) config('titan-builder.management.route_prefix', 'titan-builder'))
    ->middleware((array) config('titan-builder.management.middleware', ['web', 'auth']))
    ->group(function (): void {
        Route::get('/', [CompanyManagementController::class, 'dashboard'])->name('titan-builder.manage.dashboard');
        Route::get('/projects', [CompanyManagementController::class, 'projects'])->name('titan-builder.manage.projects');
        Route::get('/projects/{project}', [CompanyManagementController::class, 'project'])->whereNumber('project')->name('titan-builder.manage.project');
        Route::get('/applications', [CompanyManagementController::class, 'applications'])->name('titan-builder.manage.applications');
        Route::get('/applications/customer', [CompanyManagementController::class, 'application'])->defaults('surface', 'customer')->name('titan-builder.manage.application.hub');
        Route::get('/applications/field', [CompanyManagementController::class, 'application'])->defaults('surface', 'field')->name('titan-builder.manage.application.go');
        Route::get('/applications/owner', [CompanyManagementController::class, 'application'])->defaults('surface', 'owner')->name('titan-builder.manage.application.command');
        Route::get('/applications/onboarding', [CompanyManagementController::class, 'application'])->defaults('surface', 'onboarding')->name('titan-builder.manage.application.onboarding');
        Route::get('/applications/{surface}', [CompanyManagementController::class, 'application'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.manage.application');
        Route::get('/assets', [CompanyManagementController::class, 'assets'])->name('titan-builder.manage.assets');
        Route::get('/brand', [CompanyManagementController::class, 'brand'])->name('titan-builder.manage.brand');
        Route::get('/integrations', [CompanyManagementController::class, 'integrations'])->name('titan-builder.manage.integrations');
        Route::get('/settings', [CompanyManagementController::class, 'settings'])->name('titan-builder.manage.settings');
        Route::patch('/settings', [ManagementSettingsController::class, 'company'])->name('titan-builder.manage.settings.update');
        Route::get('/permissions', [CompanyManagementController::class, 'permissions'])->name('titan-builder.manage.permissions');

        Route::prefix('admin')->group(function (): void {
            Route::get('/', [AdminManagementController::class, 'dashboard'])->name('titan-builder.admin.dashboard');
            Route::get('/integrations', [AdminManagementController::class, 'integrations'])->name('titan-builder.admin.integrations');
            Route::get('/registry', [AdminManagementController::class, 'registry'])->name('titan-builder.admin.registry');
            Route::get('/verticals', [AdminManagementController::class, 'verticals'])->name('titan-builder.admin.verticals');
            Route::get('/permissions', [AdminManagementController::class, 'permissions'])->name('titan-builder.admin.permissions');
            Route::get('/diagnostics', [AdminManagementController::class, 'diagnostics'])->name('titan-builder.admin.diagnostics');
            Route::get('/settings', [AdminManagementController::class, 'settings'])->name('titan-builder.admin.settings');
            Route::patch('/settings', [ManagementSettingsController::class, 'admin'])->name('titan-builder.admin.settings.update');
        });
    });
