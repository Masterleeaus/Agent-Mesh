<?php

return [
    'safe_operations' => [
        'list_qc_records',
        'list_failed_qc_items',
        'list_reclean_queue',
        'list_complaint_linked_qc_cases',
        'generate_quality_report',
    ],

    // Concepts retained from CleanQuality, now implemented only by QualityControl.
    // Risk is consumed by TitanZeroAssurance; medium-risk writes require approval
    // unless a later authority profile explicitly grants autonomous execution.
    'governed_operations' => [
        'complete_inspection' => [
            'handler' => \Modules\QualityControl\Actions\CompleteInspection::class,
            'risk' => 'medium',
            'capability' => 'quality_control.inspection.complete',
        ],
        'authorise_reclean' => [
            'handler' => \Modules\QualityControl\Actions\AuthoriseReclean::class,
            'risk' => 'medium',
            'capability' => 'quality_control.reclean.authorise',
        ],
        'score_quality_check' => [
            'handler' => \Modules\QualityControl\Actions\ScoreQualityCheck::class,
            'risk' => 'low',
            'capability' => 'quality_control.quality_check.score',
        ],
        'generate_quality_report' => [
            'handler' => \Modules\QualityControl\Services\QualityReportService::class,
            'risk' => 'low',
            'capability' => 'quality_control.report.generate',
        ],
    ],
];
