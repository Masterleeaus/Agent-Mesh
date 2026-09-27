<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Context;

use App\Extensions\TitanInterfaceRuntime\System\Context\AuthenticatedContextPrincipal;

interface AuthenticatedContextPrincipalProviderContract
{
    /** Resolve security identity from authenticated/trusted host state only. */
    public function current(): AuthenticatedContextPrincipal;
}
