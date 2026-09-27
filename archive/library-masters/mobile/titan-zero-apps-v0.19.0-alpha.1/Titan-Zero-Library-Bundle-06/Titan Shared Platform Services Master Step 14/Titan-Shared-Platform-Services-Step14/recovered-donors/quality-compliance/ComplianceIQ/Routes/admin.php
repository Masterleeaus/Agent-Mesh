<?php
use Illuminate\Support\Facades\Route;use Modules\ComplianceIQ\Http\Controllers\Admin\ComplianceLogController;use Modules\ComplianceIQ\Http\Controllers\Admin\ComplianceReportController;
Route::prefix('admin/compliance')->as('admin.compliance.')->group(function():void{
 Route::get('/reports',[ComplianceReportController::class,'index'])->name('reports.index');
 Route::get('/reports/{id}',[ComplianceReportController::class,'show'])->whereNumber('id')->name('reports.show');
 Route::get('/logs',[ComplianceLogController::class,'index'])->name('logs.index');
});
