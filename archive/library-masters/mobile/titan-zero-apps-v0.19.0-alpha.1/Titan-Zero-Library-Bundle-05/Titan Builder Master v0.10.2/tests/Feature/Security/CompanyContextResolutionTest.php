<?php

declare(strict_types=1);

use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

final class CompanyContextResolutionTest extends TestCase
{
    public function test_missing_company_context_fails_closed(): void
    {
        $this->expectException(AuthorizationException::class);
        (new CompanyContext(Request::create('/')))->id();
    }

    public function test_middleware_and_actor_company_mismatch_fails_closed(): void
    {
        $request = Request::create('/');
        $request->attributes->set('company_id', 101);
        $request->setUserResolver(static fn () => new class { public int $company_id = 202; });
        $this->expectException(AuthorizationException::class);
        (new CompanyContext($request))->id();
    }

    public function test_request_payload_company_id_is_not_authority(): void
    {
        $request = Request::create('/', 'POST', ['company_id' => 999]);
        $request->setUserResolver(static fn () => new class { public int $company_id = 101; });
        self::assertSame(101, (new CompanyContext($request))->id());
    }
}
