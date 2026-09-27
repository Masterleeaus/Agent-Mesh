<?php

declare(strict_types=1);

namespace Tests\Feature\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Contracts\AdminPermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Http\Middleware\RejectClientCompanyOverride;
use App\Extensions\TitanMapsIntelligence\Http\Middleware\RequireMapsAdminPermission;
use App\Extensions\TitanMapsIntelligence\Http\Middleware\RequireMapsPermission;
use App\Extensions\TitanMapsIntelligence\Http\Middleware\ResolveCompanyScopedRouteBindings;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

final class RouteSecurityTest extends TestCase
{
    public function test_spoofed_company_id_is_rejected(): void
    {
        $request = Request::create('/api/titan/maps-intelligence/searches', 'POST', [
            'company_id' => 'company-b',
            'query' => 'plumber',
        ]);

        $this->expectException(ValidationException::class);
        (new RejectClientCompanyOverride())->handle($request, static fn (): bool => true);
    }

    public function test_denied_company_permission_fails_closed(): void
    {
        $context = new SecurityTestCompanyContext('company-a', 'user-a');
        $authorizer = new DenyCompanyPermissionAuthorizer();
        $middleware = new RequireMapsPermission($context, $authorizer);

        $this->expectException(AuthorizationException::class);
        $middleware->handle(Request::create('/usage', 'GET'), static fn (): bool => true, 'titan-maps-intelligence.usage.read');
    }

    public function test_denied_admin_permission_fails_closed(): void
    {
        $middleware = new RequireMapsAdminPermission(new DenyAdminPermissionAuthorizer());
        $request = Request::create('/dashboard/admin/titan-maps-intelligence', 'GET');
        $request->setUserResolver(static fn (): object => (object) ['id' => 'admin-a']);

        $this->expectException(AuthorizationException::class);
        $middleware->handle($request, static fn (): bool => true, 'titan-maps-intelligence.admin.access');
    }

    public function test_cross_company_route_model_id_returns_not_found(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            self::markTestSkipped('Cross-tenant binding test uses the same MySQL integration environment as the migration smoke test.');
        }

        DB::beginTransaction();
        try {
            $foreign = DiscoverySearch::query()->create([
                'company_id' => 'company-b',
                'purpose' => 'provider_discovery',
                'query' => 'plumber',
                'categories' => [],
                'filters' => [],
                'provider_strategy' => [],
                'maximum_results' => 10,
                'status' => 'queued',
            ]);

            $route = new SecurityTestRoute(['mapsSearch' => $foreign->getKey()]);
            $request = Request::create('/api/titan/maps-intelligence/searches/'.$foreign->getKey(), 'GET');
            $request->setRouteResolver(static fn () => $route);

            $middleware = new ResolveCompanyScopedRouteBindings(new SecurityTestCompanyContext('company-a', 'user-a'));
            $this->expectException(ModelNotFoundException::class);
            $middleware->handle($request, static fn (): bool => true);
        } finally {
            DB::rollBack();
        }
    }
}

final class SecurityTestCompanyContext implements AuthorisedCompanyContext
{
    public function __construct(private readonly string $company, private readonly string $user) {}
    public function companyId(): string { return $this->company; }
    public function userId(): string { return $this->user; }
    public function branchId(): ?string { return null; }
    public function workspaceId(): ?string { return null; }
}

final class DenyCompanyPermissionAuthorizer implements PermissionAuthorizer
{
    public function authorize(string $userId, string $companyId, string $permission, array $context = []): void
    {
        throw new AuthorizationException('Denied by test authorizer.');
    }
}

final class DenyAdminPermissionAuthorizer implements AdminPermissionAuthorizer
{
    public function authorize(mixed $user, string $permission): void
    {
        throw new AuthorizationException('Denied by test admin authorizer.');
    }
}

final class SecurityTestRoute
{
    public function __construct(private array $parameters) {}
    public function parameter(string $name): mixed { return $this->parameters[$name] ?? null; }
    public function setParameter(string $name, mixed $value): void { $this->parameters[$name] = $value; }
}
