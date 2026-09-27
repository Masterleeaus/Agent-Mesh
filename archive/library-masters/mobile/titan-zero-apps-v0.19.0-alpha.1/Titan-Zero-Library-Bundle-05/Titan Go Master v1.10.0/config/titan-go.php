<?php

declare(strict_types=1);

return [
    'enabled' => (bool) env('TITAN_GO_ENABLED', true),
    'surface' => 'go',
    'company_boundary' => 'company_id',
    'dependencies' => [
        'core' => 'App\\Extensions\\TitanAppsCore\\System\\Services\\TitanAppsApplicationRegistry',
        'interaction' => 'App\\Extensions\\InteractionEngine\\System\\Contracts\\PublicInteractionEngineInterface',
        'interaction_context' => 'App\\Extensions\\InteractionEngine\\System\\Contracts\\InteractionContextFactoryInterface',
        'interface' => 'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\InterfaceRuntime',
        'visual' => 'App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime',
        'builder' => 'App\\Extensions\\TitanBuilder\\System\\Contracts\\SurfaceRegistry',
        'field_provider' => 'titan-field',
    ],
    'offline' => [
        'enabled' => true,
        'queue_owner' => 'device',
        'replay_authority' => 'provider-capability-gateway',
        'idempotency_required' => true,
    ],
    'projection' => [
        'raw_domain_records' => false,
        'surface' => 'go',
    ],
];
