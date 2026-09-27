<?php

declare(strict_types=1);

namespace Tests\Feature\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\FieldReferenceGateway;
use App\Extensions\TitanMapsIntelligence\DTO\FieldReference;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Services\MapLocationService;
use Tests\TestCase;

final class MapLocationSecurityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->app->bind(AuthorisedCompanyContext::class, static fn () => new class implements AuthorisedCompanyContext {
            public function companyId(): string { return 'company-a'; }
            public function userId(): string { return 'user-a'; }
            public function branchId(): ?string { return null; }
            public function workspaceId(): ?string { return null; }
        });
    }

    public function test_deleted_or_missing_reference_cannot_be_attached(): void
    {
        $this->app->bind(FieldReferenceGateway::class, static fn () => new class implements FieldReferenceGateway {
            public function resolve(string $companyId, string $referenceType, string $publicReferenceId): ?FieldReference { return null; }
        });

        $this->expectException(MapsIntelligenceException::class);
        $this->app->make(MapLocationService::class)->resolve('job', 'deleted-job');
    }

    public function test_foreign_company_reference_cannot_be_attached(): void
    {
        $this->app->bind(FieldReferenceGateway::class, static fn () => new class implements FieldReferenceGateway {
            public function resolve(string $companyId, string $referenceType, string $publicReferenceId): ?FieldReference
            {
                return new FieldReference('company-b', $referenceType, $publicReferenceId, '1 Foreign St');
            }
        });

        $this->expectException(MapsIntelligenceException::class);
        $this->app->make(MapLocationService::class)->resolve('property', 'foreign-property');
    }
}
