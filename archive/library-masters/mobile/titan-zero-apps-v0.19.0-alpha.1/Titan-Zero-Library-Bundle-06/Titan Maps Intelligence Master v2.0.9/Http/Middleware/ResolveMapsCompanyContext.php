<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Middleware;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use Closure;
use Illuminate\Http\Request;
use RuntimeException;

final class ResolveMapsCompanyContext
{
    public function __construct(private readonly AuthorisedCompanyContext $context) {}

    public function handle(Request $request, Closure $next): mixed
    {
        $companyId = trim($this->context->companyId());
        if ($companyId === '') {
            throw new RuntimeException('Titan Maps Intelligence could not resolve an authorised tenant company.');
        }

        foreach (['company_id'] as $attribute) {
            $existing = $request->attributes->get($attribute);
            if (is_scalar($existing) && trim((string) $existing) !== '' && trim((string) $existing) !== $companyId) {
                throw new RuntimeException('Titan Maps Intelligence detected conflicting authorised company context.');
            }
        }

        // Request attributes are trusted server context only. Client-supplied company
        // identifiers are rejected by RejectClientCompanyOverride before domain work.
        $request->attributes->set('company_id', $companyId);
        $request->attributes->set('company_id', $companyId);

        return $next($request);
    }
}
