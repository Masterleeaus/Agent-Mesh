<?php

return [
    'authorization' => [
        // Compatibility for MagicAI installs that still identify actors by users.type
        // instead of attaching Spatie roles. Host user->can() remains authoritative first.
        'legacy_actor_fallback' => true,
        'legacy_actor_defaults' => [
            'user' => ['builder.read', 'builder.edit', 'builder.publish', 'builder.assets.manage', 'builder.templates.manage'],
            'admin' => ['builder.read', 'builder.edit', 'builder.publish', 'builder.assets.manage', 'builder.templates.manage', 'builder.admin'],
            'super_admin' => ['builder.read', 'builder.edit', 'builder.publish', 'builder.assets.manage', 'builder.templates.manage', 'builder.admin'],
            'superadmin' => ['builder.read', 'builder.edit', 'builder.publish', 'builder.assets.manage', 'builder.templates.manage', 'builder.admin'],
        ],
    ],
    'management' => [
        'enabled' => true,
        'route_prefix' => 'titan-builder',
        'middleware' => ['web', 'auth'],
        'admin_ability' => 'builder.admin',
    ],
    'route_prefix' => 'titan-builder/api',
    'middleware' => ['web', 'auth'],
    'generative_ui' => [
        'enabled' => true,
        'natural_language_triggers' => true,
        'preferred_chat_elements' => 50,
    ],
    'assets' => [
        'disk' => 'local',
        'max_bytes' => 10 * 1024 * 1024,
        'allowed_mime_types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    ],
    'preview' => [
        'devices' => ['mobile', 'tablet', 'desktop'],
        'network_states' => ['online', 'offline', 'syncing', 'conflict', 'empty', 'populated', 'loading', 'error', 'permission-denied'],
        'product_surfaces' => ['customer', 'field', 'owner', 'onboarding'],
        'fixture_data_only_by_default' => true,
    ],
    'integrations' => [
        // Host capability router may replace CapabilityDiscovery entirely.
        'available_capabilities' => [],
        'titan_ai' => ['required_gateway' => App\Extensions\TitanBuilder\System\Contracts\TitanAiRuntimeGateway::class],
        'crm' => ['required_gateway' => App\Extensions\TitanBuilder\System\Contracts\CrmBusinessConfigurationGateway::class],
    ],
    'provisioning' => [
        'surfaces' => ['customer', 'field', 'owner', 'onboarding'],
        'application_schema' => 'titan-mobile-application-definition/1',
        'presentation_only' => true,
        'source_code_forks' => false,
    ],
];
