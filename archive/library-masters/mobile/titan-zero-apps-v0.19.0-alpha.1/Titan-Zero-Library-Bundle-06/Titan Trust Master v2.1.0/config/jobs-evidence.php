<?php

return [
    'disk' => env('JOBS_EVIDENCE_DISK', 'public'),
    'base_path' => env('JOBS_EVIDENCE_BASE_PATH', 'work/evidence'),
    'max_upload_mb' => (int) env('JOBS_EVIDENCE_MAX_UPLOAD_MB', 25),
    'allowed_mimes' => [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
    ],
];
