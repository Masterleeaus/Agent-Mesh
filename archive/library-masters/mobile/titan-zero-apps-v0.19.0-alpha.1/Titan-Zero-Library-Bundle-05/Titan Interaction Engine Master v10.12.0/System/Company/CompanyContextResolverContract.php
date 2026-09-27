<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Company;

interface CompanyContextResolverContract
{
    /** Resolve the authenticated actor's canonical Titan company_id from trusted host identity only. */
    public function companyId(mixed $authenticatedUser): string;

    public function companyIdFromRequest(mixed $request): string;
}
