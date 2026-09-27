<?php

declare(strict_types=1);

namespace Tests\Feature\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\AuthenticatedContextPrincipalProviderContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextResolverContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use Tests\TestCase;

final class ContextSpineBindingTest extends TestCase
{
    public function test_context_spine_services_are_registered(): void
    {
        self::assertTrue($this->app->bound(AuthenticatedContextPrincipalProviderContract::class));
        self::assertTrue($this->app->bound(InterfaceContextResolverContract::class));
        self::assertTrue($this->app->bound(InterfaceContextStoreContract::class));
    }
}
