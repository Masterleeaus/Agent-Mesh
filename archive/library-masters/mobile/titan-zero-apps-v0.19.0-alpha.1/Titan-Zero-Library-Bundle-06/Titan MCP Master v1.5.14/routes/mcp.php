<?php

declare(strict_types=1);

use App\Extensions\TitanMcp\System\Http\Transport\McpTransportController;
use App\Extensions\TitanMcp\System\Mcp\Support\McpRoutePrefixPolicy;
use Illuminate\Support\Facades\Route;

$prefix = app(McpRoutePrefixPolicy::class)->normalize((string) config('titan_mcp.http.route_prefix', 'mcp/titan'));
Route::middleware((array) config('titan_mcp.http.middleware', []))->group(function () use ($prefix): void {
    Route::post($prefix, [McpTransportController::class, 'handle'])->name('titan-mcp.transport');
    Route::options($prefix, static fn () => response('', 204))->name('titan-mcp.options');
});
