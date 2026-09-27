<?php

return [
    'pass_threshold' => 70,
    'default_reclean_deadline_hours' => 24,
    'auto_create_complaint_on_failed_qc' => true,
    'severity_escalation_thresholds' => [
        'low' => 0,
        'medium' => 1,
        'high' => 2,
        'critical' => 3,
    ],
    'attachment_limits' => [
        'max_files' => 10,
        'max_size_mb' => 20,
    ],
    'dashboard' => [
        'default_window_days' => 30,
    ],
];
