<?php
use App\Extensions\TitanHub\System\Health\HubHealthCheck;
use App\Extensions\TitanHub\System\Http\Controllers\HubApiController;
use App\Extensions\TitanHub\System\Http\Controllers\HubPwaController;
use App\Extensions\TitanHub\System\Http\Controllers\HubShellController;
use Illuminate\Support\Facades\Route;

$prefix=(string)config('hub.route_prefix','customer');
$mw=array_values(array_unique(array_merge((array)config('hub.middleware',['web','auth']),['titan.hub.context'])));
Route::prefix($prefix.'/{portal}')->group(function()use($mw){
    Route::get('/manifest.webmanifest',[HubPwaController::class,'manifest'])->name('titan-hub.manifest');
    Route::get('/sw.js',[HubPwaController::class,'serviceWorker'])->name('titan-hub.sw');
    Route::get('/assets/hub.js',fn()=>response(file_get_contents(__DIR__.'/../resources/js/hub.js'),200,['Content-Type'=>'application/javascript; charset=UTF-8','Cache-Control'=>'public, max-age=3600']))->name('titan-hub.asset.js');
    Route::middleware($mw)->group(function(){
        Route::get('/',HubShellController::class)->name('titan-hub.shell');
        Route::get('/health',fn(HubHealthCheck $h)=>response()->json($h->report())->header('Cache-Control','private, no-store'));
        Route::prefix('api')->group(function(){
            Route::get('/home',[HubApiController::class,'home']);
            Route::get('/services',[HubApiController::class,'services']);
            Route::get('/requests',[HubApiController::class,'requests']);
            Route::post('/requests',[HubApiController::class,'createRequest']);
            Route::get('/jobs',[HubApiController::class,'jobs']); Route::get('/jobs/{id}',[HubApiController::class,'job']);
            Route::get('/bookings',[HubApiController::class,'bookings']); Route::post('/bookings/{id}/request-change',[HubApiController::class,'bookingChange']);
            Route::get('/quotes',[HubApiController::class,'quotes']); Route::get('/quotes/{id}',[HubApiController::class,'quote']); Route::post('/quotes/{id}/approve',[HubApiController::class,'approveQuote']);
            Route::get('/invoices',[HubApiController::class,'invoices']); Route::get('/invoices/{id}',[HubApiController::class,'invoice']);
            Route::get('/documents',[HubApiController::class,'documents']); Route::get('/profile',[HubApiController::class,'profile']); Route::get('/capabilities',[HubApiController::class,'capabilities']);
            Route::get('/interface/{workspace}',[HubApiController::class,'interface']); Route::post('/interact',[HubApiController::class,'interact']);
        });
    });
});
