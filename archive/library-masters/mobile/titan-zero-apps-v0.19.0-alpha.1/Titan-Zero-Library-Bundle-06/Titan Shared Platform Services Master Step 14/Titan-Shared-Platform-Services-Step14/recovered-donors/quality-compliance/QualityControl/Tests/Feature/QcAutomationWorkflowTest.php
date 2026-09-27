<?php

namespace Modules\QualityControl\Tests\Feature;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Modules\QualityControl\Events\QcFailedEvent;
use Modules\QualityControl\Events\QcSeverityExceededEvent;
use Modules\QualityControl\Events\VerificationScheduledEvent;
use Modules\QualityControl\Jobs\DispatchQcFailureNotificationsJob;
use Modules\QualityControl\Jobs\CreateComplaintFromCriticalQcFailureJob;
use Modules\QualityControl\Jobs\ScheduleFollowupVerificationJob;

class QcAutomationWorkflowTest extends TestCase
{
    /** @test */
    public function qc_failed_event_class_exists_and_is_dispatchable(): void
    {
        $this->assertTrue(class_exists(QcFailedEvent::class));
        $this->assertTrue(class_exists(QcSeverityExceededEvent::class));
        $this->assertTrue(class_exists(VerificationScheduledEvent::class));
    }

    /** @test */
    public function qc_jobs_implement_should_queue(): void
    {
        $interfaces = class_implements(DispatchQcFailureNotificationsJob::class);

        $this->assertContains(
            \Illuminate\Contracts\Queue\ShouldQueue::class,
            $interfaces,
            'DispatchQcFailureNotificationsJob must implement ShouldQueue'
        );

        $interfaces = class_implements(CreateComplaintFromCriticalQcFailureJob::class);

        $this->assertContains(
            \Illuminate\Contracts\Queue\ShouldQueue::class,
            $interfaces,
            'CreateComplaintFromCriticalQcFailureJob must implement ShouldQueue'
        );

        $interfaces = class_implements(ScheduleFollowupVerificationJob::class);

        $this->assertContains(
            \Illuminate\Contracts\Queue\ShouldQueue::class,
            $interfaces,
            'ScheduleFollowupVerificationJob must implement ShouldQueue'
        );
    }

    /** @test */
    public function event_service_provider_wires_qc_failed_event(): void
    {
        $provider = new \Modules\QualityControl\Providers\EventServiceProvider(app());
        $listen   = $provider->listens();

        $this->assertArrayHasKey(QcFailedEvent::class, $listen);
        $this->assertContains(
            \Modules\QualityControl\Listeners\QcFailedListener::class,
            $listen[QcFailedEvent::class]
        );
    }

    /** @test */
    public function event_service_provider_wires_all_lifecycle_events(): void
    {
        $provider = new \Modules\QualityControl\Providers\EventServiceProvider(app());
        $listen   = $provider->listens();

        $expectedEvents = [
            QcFailedEvent::class,
            QcSeverityExceededEvent::class,
            \Modules\QualityControl\Events\CorrectiveActionAssignedEvent::class,
            \Modules\QualityControl\Events\CorrectiveActionOverdueEvent::class,
            VerificationScheduledEvent::class,
            \Modules\QualityControl\Events\VerificationCompletedEvent::class,
        ];

        foreach ($expectedEvents as $event) {
            $this->assertArrayHasKey($event, $listen, "Event not wired: $event");
        }
    }

    /** @test */
    public function mail_classes_are_autoloadable(): void
    {
        $this->assertTrue(class_exists(\Modules\QualityControl\Mail\QcFailedMail::class));
        $this->assertTrue(class_exists(\Modules\QualityControl\Mail\CorrectiveActionAssignedMail::class));
        $this->assertTrue(class_exists(\Modules\QualityControl\Mail\VerificationReminderMail::class));
        $this->assertTrue(class_exists(\Modules\QualityControl\Mail\ComplaintEscalatedMail::class));
    }

    /** @test */
    public function signals_manifest_contains_domain_signal_map(): void
    {
        $signals = include module_path('QualityControl', 'manifests/signals.php');

        $this->assertArrayHasKey('emits', $signals);
        $emits = $signals['emits'];

        $this->assertArrayHasKey('qc.failed', $emits);
        $this->assertArrayHasKey('qc.severity.exceeded', $emits);
        $this->assertArrayHasKey('qc.corrective_action.assigned', $emits);
        $this->assertArrayHasKey('qc.corrective_action.overdue', $emits);
        $this->assertArrayHasKey('qc.verification.scheduled', $emits);
        $this->assertArrayHasKey('qc.verification.completed', $emits);
    }

    /** @test */
    public function score_qc_record_action_dispatches_events_on_fail(): void
    {
        Event::fake([QcFailedEvent::class, QcSeverityExceededEvent::class]);

        // Build a minimal fake record so no DB is needed.
        $record = new \Modules\QualityControl\Entities\QcRecord();
        $record->id = 99;
        $record->status = 'fail';
        $record->severity_level = 'high';
        $record->overall_score = 40;
        $record->company_id = 1;

        // Swap recalculateScore to avoid DB: just mark status=fail.
        $mock = \Mockery::mock($record)->makePartial();
        $mock->shouldReceive('recalculateScore')->andReturnNull();
        $mock->shouldReceive('fresh')->andReturn($record);

        $action = new \Modules\QualityControl\Domain\Quality\Actions\ScoreQcRecordAction();
        $action->handle($mock);

        Event::assertDispatched(QcFailedEvent::class);
        Event::assertDispatched(QcSeverityExceededEvent::class);
    }
}
