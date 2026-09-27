<?php
namespace Modules\ComplianceIQ\Providers;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider; use Illuminate\Support\Facades\Route;
class RouteServiceProvider extends ServiceProvider { public function map():void { Route::middleware(['web','auth'])->group(__DIR__.'/../Routes/admin.php'); Route::prefix('api')->middleware('auth:api')->group(__DIR__.'/../Routes/api.php'); } }
