<?php

return [
    'emits' => [
        'quality_control.reclean_triggered',
        'quality_control.needs_reclean',
        'quality_control.record_failed',
        'quality_control.record_passed',
        // Phase 4 domain lifecycle signals
        'qc.failed'                         => [
            'event'    => \Modules\QualityControl\Events\QcFailedEvent::class,
            'job'      => \Modules\QualityControl\Jobs\DispatchQcFailureNotificationsJob::class,
            'mail'     => \Modules\QualityControl\Mail\QcFailedMail::class,
            'listener' => \Modules\QualityControl\Listeners\QcFailedListener::class,
        ],
        'qc.severity.exceeded'              => [
            'event'    => \Modules\QualityControl\Events\QcSeverityExceededEvent::class,
            'job'      => \Modules\QualityControl\Jobs\CreateComplaintFromCriticalQcFailureJob::class,
            'mail'     => \Modules\QualityControl\Mail\ComplaintEscalatedMail::class,
            'listener' => \Modules\QualityControl\Listeners\QcSeverityExceededListener::class,
        ],
        'qc.corrective_action.assigned'     => [
            'event'    => \Modules\QualityControl\Events\CorrectiveActionAssignedEvent::class,
            'job'      => null,
            'mail'     => \Modules\QualityControl\Mail\CorrectiveActionAssignedMail::class,
            'listener' => \Modules\QualityControl\Listeners\CorrectiveActionAssignedListener::class,
        ],
        'qc.corrective_action.overdue'      => [
            'event'    => \Modules\QualityControl\Events\CorrectiveActionOverdueEvent::class,
            'job'      => \Modules\QualityControl\Jobs\EscalateOverdueCorrectiveActionsJob::class,
            'mail'     => \Modules\QualityControl\Mail\ComplaintEscalatedMail::class,
            'listener' => \Modules\QualityControl\Listeners\CorrectiveActionOverdueListener::class,
        ],
        'qc.verification.scheduled'         => [
            'event'    => \Modules\QualityControl\Events\VerificationScheduledEvent::class,
            'job'      => \Modules\QualityControl\Jobs\ScheduleFollowupVerificationJob::class,
            'mail'     => \Modules\QualityControl\Mail\VerificationReminderMail::class,
            'listener' => \Modules\QualityControl\Listeners\VerificationScheduledListener::class,
        ],
        'qc.verification.completed'         => [
            'event'    => \Modules\QualityControl\Events\VerificationCompletedEvent::class,
            'job'      => null,
            'mail'     => null,
            'listener' => \Modules\QualityControl\Listeners\VerificationCompletedListener::class,
        ],
    ],
    'consumes' => [
        'job.completed',
        'cleaning.job.completed',
        // Planning-phase signals emitted by Inspection module
        'inspection.schedule_created',
        'inspection.schedule_assigned',
        'inspection.schedule_recurring_triggered',
        'inspection.template_applied',
    ],
];
