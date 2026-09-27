<?php

return [
    'module_alias' => 'quality_control',
    'module_name' => 'Quality Control',
    'packages' => [
        'superadmin',
        'company',
    ],
    'roles' => [
        'admin',
        'employee',
    ],
    'permissions' => [
        'view_quality_control',
        'add_quality_control',
        'edit_quality_control',
        'delete_quality_control',
        'view_qc_reports',
        'manage_qc_templates',
        'trigger_reclean',
        'view_cleaner_ratings',
        'manage_qc_corrective_actions',
        'verify_qc_followups',
        // Phase 8 additions
        'view_qc_corrective_actions',
        'assign_qc_corrective_actions',
        'verify_qc_corrective_actions',
        'view_qc_verification_queue',
        'manage_qc_escalations',
    ],
    'package_labels' => [
        'qualitycontrol' => 'Quality Control',
        'quality_control' => 'Quality Control',
    ],
];
