<?php
return [
    'surface' => 'hub',
    'legacy_surface_aliases' => ['customer'],
    'route_prefix' => 'customer',
    'middleware' => ['web', 'auth'],
    'api_middleware' => ['web', 'auth'],
    'pwa' => [
        'name' => 'Titan Hub',
        'short_name' => 'Hub',
        'theme_color' => '#000000',
        'background_color' => '#000000',
        'display' => 'standalone',
    ],
    'security' => [
        'reject_client_company_context' => true,
        'require_authenticated_actor' => true,
        'require_company_context' => true,
        'require_customer_identity' => true,
        'cache_private_responses' => false,
    ],
];
