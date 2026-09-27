<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\TestCase;

final class LocationDomainContractTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->root = dirname(__DIR__, 2);
    }

    public function test_canonical_location_is_company_scoped_and_reference_unique(): void
    {
        $migration = (string) file_get_contents($this->root.'/database/migrations/2026_08_10_000100_create_map_locations_table.php');
        self::assertStringContainsString("Schema::create('map_locations'", $migration);
        self::assertStringContainsString("unique(['company_id', 'reference_type', 'public_reference_id']", $migration);
        self::assertStringContainsString("decimal('latitude', 10, 7)", $migration);
        self::assertStringContainsString("decimal('longitude', 11, 7)", $migration);
    }

    public function test_maps_stores_reference_and_geographic_state_not_workcore_profiles(): void
    {
        $model = (string) file_get_contents($this->root.'/Models/MapLocation.php');
        foreach (['reference_type', 'public_reference_id', 'latitude', 'longitude', 'source', 'precision'] as $field) {
            self::assertStringContainsString("'{$field}'", $model);
        }
        foreach (['customer_name', 'worker_name', 'job_title', 'customer_email', 'worker_email'] as $forbidden) {
            self::assertStringNotContainsString("'{$forbidden}'", $model);
        }
    }

    public function test_reverse_geocode_is_metadata_only(): void
    {
        $service = (string) file_get_contents($this->root.'/Services/MapLocationService.php');
        self::assertStringContainsString("'reverse_geocode_metadata'", $service);
        self::assertStringNotContainsString("'postal_address' => \$result->formattedAddress", $service);
    }

    public function test_field_reference_gateway_is_company_scoped(): void
    {
        $contract = (string) file_get_contents($this->root.'/Contracts/FieldReferenceGateway.php');
        self::assertStringContainsString('resolve(string $companyId, string $referenceType, string $publicReferenceId)', $contract);
    }
}
