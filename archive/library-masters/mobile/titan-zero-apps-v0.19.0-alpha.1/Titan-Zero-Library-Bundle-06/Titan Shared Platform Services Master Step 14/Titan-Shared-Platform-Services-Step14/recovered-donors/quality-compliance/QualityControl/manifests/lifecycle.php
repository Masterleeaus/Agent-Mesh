<?php

/**
 * Canonical QualityControl lifecycle after Titan Quality convergence Pass 2.
 *
 * QualityControl is now the sole runtime owner of planning + verification.
 * CleanQuality and Inspection are preserved only as disabled donor descriptors;
 * their routes/providers/migrations do not load. Complaint remains an external
 * escalation integration until the feedback convergence pass.
 */
return [
    'module' => 'quality_control',
    'role'   => 'quality_assurance_engine',

    'owner' => [
        'inspection_templates',
        'inspection_template_items',
        'inspection_schedules',
        'inspection_schedule_items',
        'inspection_schedule_recurring',
        'inspection_schedule_recurring_items',
        'inspection_schedule_replies',
        'inspection_schedule_files',
        'qc_records',
        'qc_record_items',
        'qc_corrective_actions',
        'qc_corrective_action_updates',
        'qc_followup_verifications',
        'qc_status_catalog',
    ],

    'phases' => [
        'schedule_created' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Domain\Quality\Actions\CreateInspectionScheduleAction::class,
        ],
        'schedule_rescheduled' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Domain\Quality\Actions\RescheduleInspectionAction::class,
        ],
        'template_applied' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Domain\Quality\Actions\CreateInspectionTemplateAction::class,
        ],
        'record_created' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Domain\Quality\Actions\CreateQcRecordAction::class,
        ],
        'record_scored' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Domain\Quality\Actions\ScoreQcRecordAction::class,
        ],
        'record_completed' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Actions\CompleteInspection::class,
        ],
        'record_passed' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Domain\Quality\Actions\PassQcRecordAction::class,
        ],
        'record_failed' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Domain\Quality\Actions\FailQcRecordAction::class,
        ],
        'reclean_authorised' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Actions\AuthoriseReclean::class,
        ],
        'issue_escalated' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Domain\Quality\Actions\EscalateQcIssueAction::class,
        ],
        'record_closed' => [
            'owner'  => 'quality_control',
            'action' => \Modules\QualityControl\Domain\Quality\Actions\CloseQcRecordAction::class,
        ],
        'complaint_auto_created' => [
            'owner'   => 'quality_control',
            'action'  => \Modules\QualityControl\Domain\Quality\Actions\CreateComplaintFromQcFailureAction::class,
            'trigger' => 'severity_level >= qc_auto_create_complaint_threshold',
        ],
        'qc_from_complaint' => [
            'owner'   => 'quality_control',
            'action'  => \Modules\QualityControl\Domain\Quality\Actions\CreateQcFromComplaintAction::class,
            'trigger' => 'complaint.qc_followup_required = true',
        ],
    ],

    'compatibility' => [
        'legacy_modules' => ['CleanQuality', 'Inspection'],
        'runtime_owner' => 'QualityControl',
        'legacy_modules_runtime' => 'disabled',
        'route_backward_compat' => 'explicit_quality_control_bridges',
        'legacy_inspections_table' => 'migration_source_only; qc_records is canonical quality result store',
    ],
];
