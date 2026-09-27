<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanMapsIntelligence;

use PHPUnit\Framework\TestCase;

final class WorkerTrackingContractTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->root = dirname(__DIR__, 2);
    }

    public function test_ping_history_and_tracking_state_are_company_scoped(): void
    {
        $pings = (string) file_get_contents($this->root.'/database/migrations/2026_08_10_000300_create_maps_location_pings_table.php');
        $state = (string) file_get_contents($this->root.'/database/migrations/2026_08_10_000400_create_maps_worker_tracking_states_table.php');
        self::assertStringContainsString("Schema::create('maps_location_pings'", $pings);
        self::assertStringContainsString("['company_id', 'worker_public_id', 'captured_at']", $pings);
        self::assertStringContainsString("Schema::create('maps_worker_tracking_states'", $state);
        self::assertStringContainsString("unique(['company_id', 'worker_public_id']", $state);
    }

    public function test_worker_write_path_has_duty_consent_and_timestamp_guards(): void
    {
        $service = (string) file_get_contents($this->root.'/Services/WorkerTrackingService.php');
        foreach (['MAPS_TRACKING_NOT_ALLOWED','MAPS_WORKER_OFF_DUTY','MAPS_LOCATION_CAPTURE_STALE','MAPS_LOCATION_CAPTURE_FUTURE','MAPS_LOCATION_ACCURACY_TOO_LOW'] as $code) {
            self::assertStringContainsString($code, $service);
        }
        self::assertStringContainsString("'reference_type' => 'worker'", $service);
        self::assertStringContainsString("'source' => 'gps'", $service);
    }

    public function test_fallback_identity_cannot_impersonate_another_worker(): void
    {
        $resolver = (string) file_get_contents($this->root.'/Services/AuthenticatedWorkerIdentityResolver.php');
        self::assertStringContainsString('MAPS_WORKER_REFERENCE_DENIED', $resolver);
        self::assertStringContainsString('hash_equals($workerId, $requested)', $resolver);
    }
}
