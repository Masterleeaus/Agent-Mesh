<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Context;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

interface InterfaceContextResolverContract
{
    /**
     * Resolve an explicit, authorization-ready interface context.
     * Implementations MUST fail closed when required tenant/user context is absent.
     *
     * @param array<string, scalar|null> $overrides
     */
    public function resolve(array $overrides = []): InterfaceContext;
}
