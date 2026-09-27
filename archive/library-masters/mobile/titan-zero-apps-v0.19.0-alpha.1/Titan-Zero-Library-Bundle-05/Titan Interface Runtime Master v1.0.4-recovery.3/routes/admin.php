<?php

declare(strict_types=1);

use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\HealthController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\LivenessController;
use App\Extensions\TitanInterfaceRuntime\System\Http\Controllers\ReadinessController;
use Illuminate\Routing\Router;

/** @var Router $router */
$router->get('/health', HealthController::class)->name('health');
$router->get('/live', LivenessController::class)->name('liveness');
$router->get('/ready', ReadinessController::class)->name('readiness');
