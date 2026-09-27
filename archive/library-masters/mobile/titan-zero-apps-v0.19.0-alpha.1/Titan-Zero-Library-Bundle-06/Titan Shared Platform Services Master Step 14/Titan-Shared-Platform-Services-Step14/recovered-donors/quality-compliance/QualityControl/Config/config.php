<?php

return [
    // Human name for display (Packages label is handled in core lang files)
    'name' => 'Quality Control',

    // Worksuite installer metadata
    'parent_envato_id' => 23263417,
    'parent_product_name' => 'worksuite-saas-new',
    'parent_min_version' => '5.3.6',

    /*
    |--------------------------------------------------------------------------
    | Feature flags (module-local)
    |--------------------------------------------------------------------------
    */
    'titan_links' => true,

    /*
    |--------------------------------------------------------------------------
    | Cleaning workflow options
    |--------------------------------------------------------------------------
    | These options let the module integrate into cleaning ops without requiring
    | a hard dependency on a specific Jobs/Issues module.
    |
    | - auto_create_on_job_complete: listens for common "job completed" events
    |   and creates a Quality Check schedule automatically.
    | - create_issue_on_needs_reclean: when a check is marked "Needs Re-Clean",
    |   dispatch an event that other modules (Cleaning Issues) can consume.
    */
    'auto_create_on_job_complete' => false,
    'create_issue_on_needs_reclean' => true,
    'auto_create_complaint_on_failed_qc' => true,
    'pass_threshold' => 70,
    'default_reclean_deadline_hours' => 24,
    'severity_escalation_thresholds' => [
        'low' => 0,
        'medium' => 1,
        'high' => 2,
        'critical' => 3,
    ],
    'verification_queue' => [
        'overdue_window_hours' => 24,
    ],
    'attachment_limits' => [
        'max_files' => 10,
        'max_size_mb' => 20,
    ],
    'dashboard' => [
        'default_window_days' => 30,
    ],

    // Automation thresholds and timings (Phase 7)
    'qc_auto_create_complaint_threshold' => 'high',
    'qc_reclean_deadline_hours' => 24,
    'qc_corrective_action_sla_hours' => 48,
    'qc_verification_reminder_hours' => 24,

    // File categories used for proof photos.
    'photo_categories' => ['before', 'after', 'general'],
];
