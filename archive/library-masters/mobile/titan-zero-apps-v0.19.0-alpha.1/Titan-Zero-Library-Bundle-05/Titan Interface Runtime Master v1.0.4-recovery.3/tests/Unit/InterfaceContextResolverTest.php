<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Context\AuthenticatedContextPrincipal;
use App\Extensions\TitanInterfaceRuntime\System\Context\ContextResolutionException;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContextResolver;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\AuthenticatedContextPrincipalProviderContract;
use PHPUnit\Framework\TestCase;

final class InterfaceContextResolverTest extends TestCase
{
    private function resolver(): InterfaceContextResolver
    {
        $provider = new class implements AuthenticatedContextPrincipalProviderContract {
            public function current(): AuthenticatedContextPrincipal
            {
                return new AuthenticatedContextPrincipal(
                    companyId: 41,
                    userId: 7,
                    roles: ['owner'],
                    capabilities: ['crm.read'],
                    teamId: '12',
                );
            }
        };

        return new InterfaceContextResolver($provider, ['command', 'go', 'hub', 'onboarding'], 'command', 'platform');
    }

    public function test_context_inherits_authenticated_security_identity(): void
    {
        $context = $this->resolver()->resolve(['domain' => 'work']);

        self::assertSame(41, $context->companyId);
        self::assertSame(7, $context->userId);
        self::assertSame(['owner'], $context->roles);
        self::assertSame(['crm.read'], $context->capabilities);
        self::assertSame('12', $context->teamId);
        self::assertSame('work', $context->domain);
        self::assertNotSame('', $context->traceId);
        self::assertNotSame('', $context->correlationId);
    }

    public function test_cross_tenant_override_fails_closed(): void
    {
        $this->expectException(ContextResolutionException::class);
        $this->expectExceptionMessage('tenant_company_id');

        $this->resolver()->resolve(['tenant_company_id' => 99]);
    }

    public function test_child_context_cannot_change_security_principal_or_surface(): void
    {
        $context = $this->resolver()->resolve(['product_surface' => 'hub']);

        $this->expectException(ContextResolutionException::class);
        $this->expectExceptionMessage('product_surface');
        $context->with(['product_surface' => 'command']);
    }
}
