<?php

declare(strict_types=1);

return [
    'schema' => 'titan.assurance.v1',
    'company_boundary' => 'company_id',
    'risk' => [
        'auto_execute' => ['low'],
        'approval_required' => ['medium', 'high', 'critical'],
    ],
];
