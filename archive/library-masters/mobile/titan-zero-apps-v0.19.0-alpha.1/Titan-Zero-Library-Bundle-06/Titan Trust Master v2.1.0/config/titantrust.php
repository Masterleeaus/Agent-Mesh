<?php

return [
    // Storage settings
    'disk' => env('TITANTRUST_DISK', env('JOBS_EVIDENCE_DISK', 'private')),
    'base_path' => env('TITANTRUST_BASE_PATH', env('JOBS_EVIDENCE_BASE_PATH', 'work/evidence')),

    // Upload policy
    'max_upload_mb' => (int) env('TITANTRUST_MAX_UPLOAD_MB', env('JOBS_EVIDENCE_MAX_UPLOAD_MB', 25)),
    'allowed_mimes' => [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        // Optional: enable later via env if you want
        // 'video/mp4',
        // 'audio/mpeg',
        // 'audio/mp4',
        // 'audio/wav',
    ],

    // Public signoff tokens
    'public_signoff_max_hours' => (int) env('TITANTRUST_SIGNOFF_MAX_HOURS', 720),
];
