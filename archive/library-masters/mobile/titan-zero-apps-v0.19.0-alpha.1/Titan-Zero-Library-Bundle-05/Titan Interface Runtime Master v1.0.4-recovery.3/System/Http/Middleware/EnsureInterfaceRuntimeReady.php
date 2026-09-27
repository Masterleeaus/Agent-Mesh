<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Http\Middleware;
use App\Extensions\TitanInterfaceRuntime\System\Operations\RuntimeOperationalState;
use Closure; use Illuminate\Http\Request; use Symfony\Component\HttpFoundation\Response;
final readonly class EnsureInterfaceRuntimeReady
{
    public function __construct(private RuntimeOperationalState $state) {}
    public function handle(Request $request, Closure $next): Response
    {
        if(!$this->state->acceptsTraffic()) return response()->json(['error'=>'Titan Interface Runtime is not ready','readiness'=>$this->state->readiness()],503);
        return $next($request);
    }
}
