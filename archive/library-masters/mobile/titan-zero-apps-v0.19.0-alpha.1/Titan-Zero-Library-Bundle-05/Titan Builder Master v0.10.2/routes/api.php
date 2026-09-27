<?php

declare(strict_types=1);

use App\Extensions\TitanBuilder\System\Http\Controllers\ApplicationProvisioningController;
use App\Extensions\TitanBuilder\System\Http\Controllers\AssetController;
use App\Extensions\TitanBuilder\System\Http\Controllers\CatalogueController;
use App\Extensions\TitanBuilder\System\Http\Controllers\GenerativeUiController;
use App\Extensions\TitanBuilder\System\Http\Controllers\PageController;
use App\Extensions\TitanBuilder\System\Http\Controllers\ProjectController;
use App\Extensions\TitanBuilder\System\Http\Controllers\PreviewController;
use App\Extensions\TitanBuilder\System\Http\Controllers\PublishController;
use Illuminate\Support\Facades\Route;

Route::prefix((string) config('titan-builder.route_prefix', 'titan-builder/api'))
    ->middleware((array) config('titan-builder.middleware', ['web', 'auth']))
    ->group(function (): void {
        Route::get('/catalogue', CatalogueController::class)->name('titan-builder.catalogue');
        Route::post('/projects', [ProjectController::class, 'store'])->name('titan-builder.projects.store');
        Route::post('/projects/{project}/pages', [PageController::class, 'store'])->whereNumber('project')->name('titan-builder.pages.store');
        Route::put('/pages/{page}/spec', [PageController::class, 'saveSpec'])->whereNumber('page')->name('titan-builder.pages.spec');
        Route::post('/projects/{project}/assets', [AssetController::class, 'store'])->whereNumber('project')->name('titan-builder.assets.store');
        Route::post('/generative-ui/validate', [GenerativeUiController::class, 'validateSpec'])->name('titan-builder.generative-ui.validate');
        Route::post('/generative-ui/repair', [GenerativeUiController::class, 'repair'])->name('titan-builder.generative-ui.repair');
        Route::post('/generative-ui/propose', [GenerativeUiController::class, 'propose'])->name('titan-builder.generative-ui.propose');
        Route::post('/preview', PreviewController::class)->name('titan-builder.preview');
        Route::post('/projects/{project}/publish', [PublishController::class, 'publish'])->whereNumber('project')->name('titan-builder.publish');
        Route::post('/projects/{project}/rollback/{snapshot}', [PublishController::class, 'rollback'])->whereNumber('project')->whereNumber('snapshot')->name('titan-builder.rollback');

        Route::get('/applications', [ApplicationProvisioningController::class, 'index'])->name('titan-builder.applications.index');
        Route::post('/applications/provision', [ApplicationProvisioningController::class, 'provisionSet'])->name('titan-builder.applications.provision');
        Route::get('/applications/handoff', [ApplicationProvisioningController::class, 'handoff'])->name('titan-builder.applications.handoff');
        Route::patch('/applications/brand', [ApplicationProvisioningController::class, 'sharedBrand'])->name('titan-builder.applications.shared-brand');
        Route::get('/applications/{surface}', [ApplicationProvisioningController::class, 'show'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.show');
        Route::post('/applications/{surface}', [ApplicationProvisioningController::class, 'create'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.create');
        Route::patch('/applications/{surface}/identity', [ApplicationProvisioningController::class, 'identity'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.identity');
        Route::patch('/applications/{surface}/brand', [ApplicationProvisioningController::class, 'brand'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.brand');
        Route::patch('/applications/{surface}/navigation', [ApplicationProvisioningController::class, 'navigation'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.navigation');
        Route::patch('/applications/{surface}/features', [ApplicationProvisioningController::class, 'features'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.features');
        Route::patch('/applications/{surface}/pages', [ApplicationProvisioningController::class, 'pages'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.pages');
        Route::patch('/applications/{surface}/theme', [ApplicationProvisioningController::class, 'theme'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.theme');
        Route::patch('/applications/{surface}/assistant', [ApplicationProvisioningController::class, 'assistant'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.assistant');
        Route::patch('/applications/{surface}/privacy', [ApplicationProvisioningController::class, 'privacy'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.privacy');
        Route::patch('/applications/{surface}/notifications', [ApplicationProvisioningController::class, 'notifications'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.notifications');
        Route::patch('/applications/{surface}/offline', [ApplicationProvisioningController::class, 'offline'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.offline');
        Route::post('/applications/{surface}/vertical', [ApplicationProvisioningController::class, 'vertical'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.vertical');
        Route::post('/applications/{surface}/preview', [ApplicationProvisioningController::class, 'preview'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.preview');
        Route::post('/applications/{surface}/validate', [ApplicationProvisioningController::class, 'validateApplication'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.validate');
        Route::get('/applications/{surface}/readiness', [ApplicationProvisioningController::class, 'readiness'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.readiness');
        Route::post('/applications/{surface}/publish', [ApplicationProvisioningController::class, 'publish'])->whereIn('surface', ['customer','field','owner','onboarding'])->name('titan-builder.applications.publish');
        Route::post('/applications/{surface}/rollback/{snapshot}', [ApplicationProvisioningController::class, 'rollback'])->whereIn('surface', ['customer','field','owner','onboarding'])->whereNumber('snapshot')->name('titan-builder.applications.rollback');
        Route::post('/applications/{surface}/activate/{snapshot}', [ApplicationProvisioningController::class, 'activate'])->whereIn('surface', ['customer','field','owner','onboarding'])->whereNumber('snapshot')->name('titan-builder.applications.activate');
    });
