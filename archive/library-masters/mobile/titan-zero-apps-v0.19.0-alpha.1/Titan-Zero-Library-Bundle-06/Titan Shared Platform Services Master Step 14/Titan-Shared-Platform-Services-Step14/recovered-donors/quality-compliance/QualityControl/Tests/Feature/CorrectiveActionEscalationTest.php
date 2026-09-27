<?php

namespace Modules\QualityControl\Tests\Feature;

use Tests\TestCase;
use Modules\QualityControl\Jobs\EscalateOverdueCorrectiveActionsJob;
use Modules\QualityControl\Jobs\EnforceCorrectiveActionSlaJob;
use Modules\QualityControl\Console\Commands\EnforceCorrectiveActionSlaCommand;

class CorrectiveActionEscalationTest extends TestCase
{
    /** @test */
    public function corrective_action_entity_is_autoloadable(): void
    {
        $this->assertTrue(class_exists(\Modules\QualityControl\Entities\QcCorrectiveAction::class));
    }

    /** @test */
    public function escalation_job_implements_should_queue(): void
    {
        $interfaces = class_implements(EscalateOverdueCorrectiveActionsJob::class);

        $this->assertContains(
            \Illuminate\Contracts\Queue\ShouldQueue::class,
            $interfaces,
            'EscalateOverdueCorrectiveActionsJob must implement ShouldQueue'
        );
    }

    /** @test */
    public function enforce_sla_job_implements_should_queue(): void
    {
        $interfaces = class_implements(EnforceCorrectiveActionSlaJob::class);

        $this->assertContains(
            \Illuminate\Contracts\Queue\ShouldQueue::class,
            $interfaces,
            'EnforceCorrectiveActionSlaJob must implement ShouldQueue'
        );
    }

    /** @test */
    public function corrective_action_overdue_event_is_autoloadable(): void
    {
        $this->assertTrue(class_exists(\Modules\QualityControl\Events\CorrectiveActionOverdueEvent::class));
        $this->assertTrue(class_exists(\Modules\QualityControl\Events\CorrectiveActionAssignedEvent::class));
    }

    /** @test */
    public function overdue_listener_is_wired_in_event_service_provider(): void
    {
        $provider = new \Modules\QualityControl\Providers\EventServiceProvider(app());
        $listen   = $provider->listens();

        $this->assertArrayHasKey(
            \Modules\QualityControl\Events\CorrectiveActionOverdueEvent::class,
            $listen
        );

        $this->assertContains(
            \Modules\QualityControl\Listeners\CorrectiveActionOverdueListener::class,
            $listen[\Modules\QualityControl\Events\CorrectiveActionOverdueEvent::class]
        );
    }

    /** @test */
    public function sla_console_command_is_registered(): void
    {
        $this->assertTrue(
            class_exists(EnforceCorrectiveActionSlaCommand::class),
            'SLA command class must exist'
        );

        $command = new EnforceCorrectiveActionSlaCommand();
        $this->assertStringContainsString('qc:enforce-corrective-action-sla', $command->getName());
    }

    /** @test */
    public function new_automation_settings_exist_in_config(): void
    {
        $this->assertNotNull(config('quality_control.qc_auto_create_complaint_threshold'));
        $this->assertNotNull(config('quality_control.qc_reclean_deadline_hours'));
        $this->assertNotNull(config('quality_control.qc_corrective_action_sla_hours'));
        $this->assertNotNull(config('quality_control.qc_verification_reminder_hours'));
    }

    /** @test */
    public function corrective_action_overdue_event_carries_payload(): void
    {
        $action = new \Modules\QualityControl\Entities\QcCorrectiveAction();
        $action->id = 42;
        $action->qc_record_id = 10;
        $action->owner_id = 5;
        $action->severity_level = 'critical';
        $action->company_id = 1;

        $event = new \Modules\QualityControl\Events\CorrectiveActionOverdueEvent($action, 'test');

        $this->assertSame(42, $event->correctiveActionId);
        $this->assertSame('critical', $event->severityLevel);
        $this->assertSame('test', $event->triggerSource);
    }
}
