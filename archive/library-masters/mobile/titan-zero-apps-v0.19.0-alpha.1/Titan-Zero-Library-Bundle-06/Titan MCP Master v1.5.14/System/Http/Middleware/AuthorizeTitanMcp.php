<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Http\Middleware;

use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class AuthorizeTitanMcp
{
    public function __construct(private readonly CapabilityGate $gate) {}

    public function handle(Request $request, Closure $next): Response
    {
        $this->gate->assert($request->user(), 'titan.mcp.access');
        return $next($request);
    }
}
