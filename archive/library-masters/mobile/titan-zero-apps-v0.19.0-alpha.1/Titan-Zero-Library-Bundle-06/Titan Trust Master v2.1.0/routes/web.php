<?php

use Illuminate\Support\Facades\Route;


use App\Extensions\TitanTrust\Http\Controllers\JobTimelineController;

Route::middleware(['web','auth', \App\Extensions\TitanTrust\System\Http\Middleware\CaptureAuditContext::class])
    ->prefix('dashboard/user/jobs/trust')
    ->name('titantrust.jobs.')
    ->group(function () {
        Route::get('{jobId}/timeline', [JobTimelineController::class, 'show'])->name('timeline');
    });

use App\Extensions\TitanTrust\Http\Controllers\ManagerReviewController;
use App\Extensions\TitanTrust\Http\Controllers\IncidentController;

Route::middleware(['web','auth', \App\Extensions\TitanTrust\System\Http\Middleware\CaptureAuditContext::class])
    ->prefix('dashboard/user/jobs/trust')
    ->name('titantrust.review.')
    ->group(function () {
        Route::get('review', [ManagerReviewController::class, 'index'])->name('index');
        Route::post('{jobId}/override', [ManagerReviewController::class, 'override'])->name('override');

        Route::get('{jobId}/incidents', [IncidentController::class, 'index'])->name('incidents');
        Route::post('incidents/{incidentId}/resolve', [IncidentController::class, 'resolve'])->name('incidents.resolve');
    });
