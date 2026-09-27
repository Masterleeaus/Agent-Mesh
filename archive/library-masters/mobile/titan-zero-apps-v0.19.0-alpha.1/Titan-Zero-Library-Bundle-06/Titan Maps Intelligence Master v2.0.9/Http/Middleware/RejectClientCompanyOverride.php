<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class RejectClientCompanyOverride
{
    public function handle(Request $request, Closure $next): mixed
    {
        foreach (['company_id', 'tenant_id'] as $field) {
            if ($request->exists($field)) {
                throw ValidationException::withMessages([
                    $field => 'Tenant identity is resolved from the authenticated Titan company context and cannot be supplied by the client.',
                ]);
            }
        }

        return $next($request);
    }
}
