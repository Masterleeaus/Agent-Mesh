<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Middleware;

use App\Extensions\TitanMapsIntelligence\Contracts\AdminPermissionAuthorizer;
use Closure;
use Illuminate\Http\Request;

final class RequireMapsAdminPermission
{
    public function __construct(private readonly AdminPermissionAuthorizer $authorizer) {}

    public function handle(Request $request, Closure $next, string $permission = 'titan-maps-intelligence.admin.access'): mixed
    {
        $this->authorizer->authorize($request->user(), $permission);

        return $next($request);
    }
}
