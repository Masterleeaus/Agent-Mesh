<?php

declare(strict_types=1);

return [
    'sla_hours' => [
        'critical' => 4,
        'high' => 24,
        'medium' => 72,
        'low' => 120,
    ],
    'auto_escalate_overdue' => true,
    'governed_work' => [
        'work_type' => 'customer_resolution',
        'action' => 'corrective_action',
        'risk' => 'medium',
        'required_capabilities' => ['edit_feedback'],
    ],
];
