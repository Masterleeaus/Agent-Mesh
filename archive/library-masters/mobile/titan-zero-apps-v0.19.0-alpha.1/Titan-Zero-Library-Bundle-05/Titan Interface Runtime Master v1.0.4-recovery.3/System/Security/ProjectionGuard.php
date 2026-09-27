<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Security;

use App\Extensions\TitanInterfaceRuntime\System\Value\InterfaceContext;

final class ProjectionGuard
{
    public function assertContext(InterfaceContext $context): void
    {
        if ($context->surface === 'hub' && (($context->projection['customer_safe'] ?? false) !== true)) {
            throw new \RuntimeException('Hub rendering requires an explicit customer-safe projection.');
        }

        // company_id is the sole canonical tenant/company boundary. tenant_scoped is
        // recognized only as persisted compatibility metadata and resolves to the same
        // company requirement; it never represents an independent tenant dimension.
        $companyScoped = ($context->projection['company_scoped'] ?? false) === true
            || ($context->projection['tenant_scoped'] ?? false) === true;

        if ($companyScoped && $context->companyId === null) {
            throw new \RuntimeException('Company-scoped rendering requires company_id context.');
        }
    }
}
