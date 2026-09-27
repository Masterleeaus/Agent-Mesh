<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Middleware;

use App\Extensions\TitanMapsIntelligence\Contracts\InternalRequestAuthorizer;
use Closure;
use Illuminate\Contracts\Container\Container;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class RequireMapsInternalRequest
{
    public function __construct(private readonly Container $container) {}

    public function handle(Request $request, Closure $next): mixed
    {
        if (! $this->container->bound(InternalRequestAuthorizer::class)) {
            throw new AccessDeniedHttpException('Titan Maps internal routes are disabled until a service-identity authorizer is configured.');
        }

        $this->container->make(InternalRequestAuthorizer::class)->authorize($request);

        return $next($request);
    }
}
