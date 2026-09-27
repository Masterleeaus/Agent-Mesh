<?php

declare(strict_types=1);

use App\Extensions\TitanGo\System\Http\Controllers\GoShellController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->prefix('go')->name('go.')->group(function (): void {
    Route::get('/', [GoShellController::class, 'workspace'])->defaults('workspace', 'today')->name('today');
    Route::get('/jobs', [GoShellController::class, 'workspace'])->defaults('workspace', 'jobs')->name('jobs');
    Route::get('/schedule', [GoShellController::class, 'workspace'])->defaults('workspace', 'schedule')->name('schedule');
    Route::get('/inbox', [GoShellController::class, 'workspace'])->defaults('workspace', 'inbox')->name('inbox');
    Route::get('/more', [GoShellController::class, 'workspace'])->defaults('workspace', 'more')->name('more');
    Route::get('/runtime/bootstrap', [GoShellController::class, 'bootstrap'])->name('runtime.bootstrap');
    Route::get('/runtime/health', [GoShellController::class, 'health'])->name('runtime.health');
    Route::get('/runtime/client.js', [GoShellController::class, 'client'])->name('runtime.client');
});
