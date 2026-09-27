<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Middleware;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use Closure;
use Illuminate\Http\Request;

final class RequireMapsPermission
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
    ) {}

    public function handle(Request $request, Closure $next, string $permission): mixed
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize(
            $this->context->userId(),
            $companyId,
            $permission,
            ['route' => $request->route()?->getName()],
        );

        return $next($request);
    }
}
