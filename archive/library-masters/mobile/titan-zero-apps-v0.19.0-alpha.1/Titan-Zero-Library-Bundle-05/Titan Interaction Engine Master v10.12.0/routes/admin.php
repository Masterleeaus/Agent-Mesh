<?php

declare(strict_types=1);

use App\Extensions\InteractionEngine\System\Contracts\InteractionEngineManagerContract;
use App\Extensions\InteractionEngine\System\Http\Controllers\AdminSettingsController;
use App\Extensions\InteractionEngine\System\Release\CurrentRelease;
use Illuminate\Support\Facades\Route;

Route::get('/', [AdminSettingsController::class, 'overview'])->name('index');

Route::get('/health', static fn (InteractionEngineManagerContract $manager, CurrentRelease $release) => response()->json([
    'extension' => 'interaction-engine',
    'version' => $release->version(),
    ...$manager->health(),
]))->name('health');

Route::get('/settings', [AdminSettingsController::class, 'index'])->name('settings');
Route::post('/settings', [AdminSettingsController::class, 'update'])->name('settings.update');
