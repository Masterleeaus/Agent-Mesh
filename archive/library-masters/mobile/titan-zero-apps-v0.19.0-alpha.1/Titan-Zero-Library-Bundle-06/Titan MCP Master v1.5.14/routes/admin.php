<?php

declare(strict_types=1);
use App\Extensions\TitanMcp\System\Http\Controllers\TitanMcpSettingsController;
use Illuminate\Support\Facades\Route;
Route::middleware(['web','auth'])->prefix('dashboard/admin/titan-mcp')->name('dashboard.admin.titan-mcp.')->group(function():void{
    Route::get('/',[TitanMcpSettingsController::class,'overview'])->name('overview');
    Route::get('/assets/admin-overview.css',[TitanMcpSettingsController::class,'styles'])->name('styles');
    Route::get('/tools',[TitanMcpSettingsController::class,'tools'])->name('tools');
    Route::get('/runtime',[TitanMcpSettingsController::class,'runtime'])->name('runtime');
    Route::get('/backups',[TitanMcpSettingsController::class,'backups'])->name('backups');
    Route::get('/audit',[TitanMcpSettingsController::class,'audit'])->name('audit');
    Route::get('/permissions',[TitanMcpSettingsController::class,'permissions'])->name('permissions');
    Route::get('/settings',[TitanMcpSettingsController::class,'settings'])->name('settings');
    Route::post('/settings',[TitanMcpSettingsController::class,'update'])->name('update');
});
