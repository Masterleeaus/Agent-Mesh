<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Extensions\InteractionEngine\System\Http\Controllers\InteractionController;
use App\Extensions\InteractionEngine\System\Http\Controllers\CompanySettingsController;


Route::get('/settings', [CompanySettingsController::class, 'index'])->name('settings');
Route::post('/settings/company', [CompanySettingsController::class, 'updateCompany'])->name('settings.company.update');
Route::post('/settings/preferences', [CompanySettingsController::class, 'updatePreferences'])->name('settings.preferences.update');

Route::get('/{interactionId}', [InteractionController::class, 'show'])->name('show');
Route::post('/runs/{runId}/process', [InteractionController::class, 'process'])->whereNumber('runId')->name('process');
