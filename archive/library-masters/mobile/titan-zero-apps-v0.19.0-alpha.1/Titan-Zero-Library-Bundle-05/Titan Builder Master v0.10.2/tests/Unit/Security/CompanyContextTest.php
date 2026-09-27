<?php

declare(strict_types=1);

use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

final class CompanyContextTest extends TestCase
{
    public function test_trusted_attribute_company_id_is_used(): void
    {
        $request = Request::create('/');
        $request->attributes->set('company_id', 101);

        self::assertSame(101, (new CompanyContext($request))->id());
    }

    public function test_authenticated_user_company_id_is_used(): void
    {
        $request = Request::create('/');
        $request->setUserResolver(static fn () => new class {
            public int $company_id = 202;
        });

        self::assertSame(202, (new CompanyContext($request))->id());
    }

    public function test_conflicting_company_context_fails_closed(): void
    {
        $request = Request::create('/');
        $request->attributes->set('company_id', 101);
        $request->setUserResolver(static fn () => new class {
            public int $company_id = 202;
        });

        $this->expectException(AuthorizationException::class);
        (new CompanyContext($request))->id();
    }

    public function test_legacy_tenant_id_is_not_an_authorization_fallback(): void
    {
        $request = Request::create('/');
        $request->setUserResolver(static fn () => new class {
            public int $tenant_id = 101;
        });

        $this->expectException(AuthorizationException::class);
        (new CompanyContext($request))->id();
    }
}
