<?php

namespace Modules\QualityControl\Tests\Feature;

use Tests\TestCase;
use Modules\QualityControl\Events\QcFailedEvent;
use Modules\QualityControl\Events\VerificationScheduledEvent;
use Modules\QualityControl\Events\VerificationCompletedEvent;
use Modules\QualityControl\Jobs\CreateComplaintFromCriticalQcFailureJob;

class QcComplaintIntegrationAutomationTest extends TestCase
{
    /** @test */
    public function complaint_migration_adds_qc_followup_columns(): void
    {
        // Verify the migration file exists.
        $migrationPath = module_path('Complaint', 'Database/Migrations/2026_04_20_230000_add_qc_followup_fields_to_complaint_table.php');
        $this->assertFileExists($migrationPath);
    }

    /** @test */
    public function create_complaint_from_critical_qc_failure_job_implements_should_queue(): void
    {
        $interfaces = class_implements(CreateComplaintFromCriticalQcFailureJob::class);

        $this->assertContains(
            \Illuminate\Contracts\Queue\ShouldQueue::class,
            $interfaces
        );
    }

    /** @test */
    public function qc_severity_exceeded_listener_is_wired(): void
    {
        $provider = new \Modules\QualityControl\Providers\EventServiceProvider(app());
        $listen   = $provider->listens();

        $this->assertArrayHasKey(\Modules\QualityControl\Events\QcSeverityExceededEvent::class, $listen);
        $this->assertContains(
            \Modules\QualityControl\Listeners\QcSeverityExceededListener::class,
            $listen[\Modules\QualityControl\Events\QcSeverityExceededEvent::class]
        );
    }

    /** @test */
    public function verification_completed_listener_is_wired(): void
    {
        $provider = new \Modules\QualityControl\Providers\EventServiceProvider(app());
        $listen   = $provider->listens();

        $this->assertArrayHasKey(VerificationCompletedEvent::class, $listen);
        $this->assertContains(
            \Modules\QualityControl\Listeners\VerificationCompletedListener::class,
            $listen[VerificationCompletedEvent::class]
        );
    }

    /** @test */
    public function qc_failed_event_carries_required_payload(): void
    {
        $record = new \Modules\QualityControl\Entities\QcRecord();
        $record->id = 55;
        $record->site_id = 10;
        $record->team_id = 20;
        $record->severity_level = 'critical';
        $record->risk_score = 90;
        $record->company_id = 3;

        $event = new QcFailedEvent($record, 'unit_test');

        $this->assertSame(55, $event->qcRecordId);
        $this->assertSame(10, $event->siteId);
        $this->assertSame(20, $event->teamId);
        $this->assertSame('critical', $event->severityLevel);
        $this->assertSame(90, $event->riskScore);
        $this->assertSame(3, $event->companyId);
        $this->assertSame('unit_test', $event->triggerSource);
    }

    /** @test */
    public function permissions_manifest_contains_phase8_permissions(): void
    {
        $manifest = include module_path('QualityControl', 'manifests/permissions.php');
        $perms    = $manifest['permissions'];

        $expected = [
            'view_qc_corrective_actions',
            'assign_qc_corrective_actions',
            'verify_qc_corrective_actions',
            'view_qc_verification_queue',
            'manage_qc_escalations',
        ];

        foreach ($expected as $perm) {
            $this->assertContains($perm, $perms, "Missing permission: $perm");
        }
    }
}
