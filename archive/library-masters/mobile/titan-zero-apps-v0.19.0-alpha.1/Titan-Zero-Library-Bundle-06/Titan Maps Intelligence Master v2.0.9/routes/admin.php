<?php

declare(strict_types=1);

use App\Extensions\TitanMapsIntelligence\Http\Controllers\AdminDashboardController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\AdminNavigationController;
use Illuminate\Support\Facades\Route;

Route::get('/', AdminDashboardController::class)->name('index');
Route::get('/navigation', AdminNavigationController::class)->defaults('maps_admin_page', 'overview')->name('navigation.index');
Route::get('/providers', AdminNavigationController::class)->defaults('maps_admin_page', 'providers')->name('navigation.providers');
Route::get('/usage', AdminNavigationController::class)->defaults('maps_admin_page', 'usage')->name('navigation.usage');
Route::get('/diagnostics', AdminNavigationController::class)->defaults('maps_admin_page', 'diagnostics')->name('navigation.diagnostics');
