<?php

declare(strict_types=1);

return [
    'module' => 'titan_zero_assurance',
    'capabilities' => [
        [
            'key' => 'assurance.context.inspect',
            'label' => 'Inspect assurance execution context',
            'risk' => 'low',
            'requires' => [],
            'handler' => 'assurance.context.inspect',
        ],
        [
            'key' => 'compliance.audit.read',
            'label' => 'Read company compliance audit stream',
            'risk' => 'low',
            'requires' => [],
            'handler' => 'compliance.audit.read',
        ],
        [
            'key' => 'compliance.integrity.verify',
            'label' => 'Verify compliance audit integrity',
            'risk' => 'low',
            'requires' => [],
            'handler' => 'compliance.integrity.verify',
        ],
        [
            'key' => 'compliance.corrective.manage',
            'label' => 'Manage compliance corrective action',
            'risk' => 'high',
            'requires' => [],
            'handler' => 'compliance.corrective.manage',
        ],
        [
            'key' => 'quality.corrective.manage',
            'label' => 'Manage quality corrective action',
            'risk' => 'high',
            'requires' => [],
            'handler' => 'quality.corrective.manage',
        ],
        [
            'key' => 'feedback.resolve',
            'label' => 'Resolve customer feedback and complaints',
            'risk' => 'high',
            'requires' => [],
            'handler' => 'feedback.resolve',
        ],
        [
            'key' => 'evidence.review',
            'label' => 'Review trust evidence and incidents',
            'risk' => 'high',
            'requires' => [],
            'handler' => 'evidence.review',
        ],
        [
            'key' => 'assurance.authority.evaluate',
            'label' => 'Evaluate governed action authority',
            'risk' => 'low',
            'requires' => [],
            'handler' => 'assurance.authority.evaluate',
        ],
    ],
    'zero_enabled' => true,
];
