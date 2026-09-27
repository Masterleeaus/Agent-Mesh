<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\TestCase;

final class RouteSecurityContractTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->root = dirname(__DIR__, 2);
    }

    public function test_four_route_profiles_are_packaged_and_registered(): void
    {
        foreach (['user.php', 'admin.php', 'api.php', 'internal.php'] as $routeFile) {
            self::assertFileExists($this->root.'/routes/'.$routeFile);
        }

        $provider = $this->source('System/TitanMapsIntelligenceServiceProvider.php');
        self::assertStringContainsString("['web', 'auth', 'titan.maps.reject-company-override', 'titan.maps.company'", $provider);
        self::assertStringContainsString("['web', 'auth', 'admin', 'titan.maps.admin:titan-maps-intelligence.admin.access']", $provider);
        self::assertStringContainsString("['api', 'auth:sanctum', 'titan.maps.reject-company-override', 'titan.maps.company'", $provider);
        self::assertStringContainsString("['api', 'titan.maps.internal']", $provider);
    }

    public function test_api_actions_have_explicit_permission_middleware(): void
    {
        $api = $this->source('routes/api.php');
        foreach ([
            'search.create', 'search.read', 'search.cancel', 'search.export',
            'candidate.read', 'candidate.classify', 'candidate.approve',
            'candidate.reject', 'candidate.promote', 'territory.analyse', 'usage.read',
            'route.calculate', 'route.read', 'matrix.calculate', 'matrix.read', 'nearest-resource.find', 'route-plan.manage', 'route-plan.read', 'dispatch.recommend', 'dispatch.read', 'dispatch.manage',
        ] as $suffix) {
            self::assertStringContainsString('titan.maps.permission:titan-maps-intelligence.'.$suffix, $api, $suffix);
        }
    }

    public function test_company_scoped_route_binding_resolves_only_inside_active_company(): void
    {
        $binder = $this->source('Http/Middleware/ResolveCompanyScopedRouteBindings.php');
        self::assertStringContainsString("'mapsSearch' => DiscoverySearch::class", $binder);
        self::assertStringContainsString("'mapsCandidate' => DiscoveryCandidate::class", $binder);
        self::assertStringContainsString("'mapsAnalysis' => TerritoryAnalysis::class", $binder);
        self::assertStringContainsString("'mapsRouteSnapshot' => RouteSnapshot::class", $binder);
        self::assertStringContainsString("'mapsRoutePlan' => RoutePlan::class", $binder);
        self::assertStringContainsString("'mapsDispatchRecommendation' => DispatchRecommendation::class", $binder);
        self::assertStringContainsString("->where('company_id', $companyId)", $binder);
        self::assertStringContainsString('->firstOrFail()', $binder);
    }

    public function test_client_company_override_is_rejected_before_controllers(): void
    {
        $middleware = $this->source('Http/Middleware/RejectClientCompanyOverride.php');
        self::assertStringContainsString("['company_id', 'tenant_id']", $middleware);
        self::assertStringContainsString('ValidationException::withMessages', $middleware);

        foreach (glob($this->root.'/Http/Requests/*.php') ?: [] as $requestFile) {
            self::assertStringContainsString("'company_id' => ['prohibited']", (string) file_get_contents($requestFile), basename($requestFile));
        }
    }

    public function test_company_id_is_immutable_after_record_creation(): void
    {
        $model = $this->source('Models/CompanyScopedModel.php');
        self::assertStringContainsString('static::updating', $model);
        self::assertStringContainsString("getOriginal('company_id')", $model);
        self::assertStringContainsString('hash_equals($original, $current)', $model);
    }

    public function test_queued_discovery_executes_inside_serialized_company_context(): void
    {
        foreach (['Jobs/ExecuteDiscoverySearch.php', 'Jobs/ProcessDiscoveryPage.php'] as $job) {
            $source = $this->source($job);
            self::assertStringContainsString('QueueTenantContext $tenantContext', $source, $job);
            self::assertStringContainsString('$tenantContext->run($this->companyId', $source, $job);
            self::assertStringContainsString("->where('company_id', $this->companyId)", $source, $job);
        }
    }

    private function source(string $relative): string
    {
        return (string) file_get_contents($this->root.'/'.$relative);
    }
}
