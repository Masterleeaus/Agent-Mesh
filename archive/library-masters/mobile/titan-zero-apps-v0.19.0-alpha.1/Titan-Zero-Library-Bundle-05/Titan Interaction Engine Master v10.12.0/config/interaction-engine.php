<?php

declare(strict_types=1);

$extensionRoot = dirname(__DIR__);

return [
    'operations'=>['ttl_seconds'=>604800],
    'titan_apps' => ['owner' => 'titan-apps-suite', 'component' => 'interaction-engine', 'public' => true, 'canonical_surfaces' => ['zero','go','hub']],

    'enabled' => (bool) env('INTERACTION_ENGINE_ENABLED', true),
    'definitions_path' => env('INTERACTION_DEFINITIONS_PATH', $extensionRoot . '/resources/interactions'),
    'fragments_path' => env('INTERACTION_FRAGMENTS_PATH', $extensionRoot . '/resources/interactions/fragments'),
    'cache_ttl' => (int) env('INTERACTION_CACHE_TTL', 3600),
    'renderer' => env('INTERACTION_RENDERER', 'blade'),
    'view' => env('INTERACTION_VIEW', 'interaction-engine::run'),

    'profile' => [
        'id' => 'field_home_services',
        'tenant_key' => 'company_id',
        'question_catalogue' => $extensionRoot . '/resources/onboarding/field-home-services-question-catalog.json',
    ],

    'capabilities' => [
        // Deprecated names remain aliases only; one canonical capability has one authority/provider.
        'aliases' => [
            'jobs.create' => 'crm.work_order.create','jobs.complete' => 'crm.work_order.complete','quotes.create' => 'crm.quote.create',
            'finance.invoice.create' => 'crm.invoice.create','finance.payment.record' => 'crm.payment.record','field_services.bookings.create' => 'crm.appointment.create',
            'field_services.job_variations.approve' => 'crm.work_order.update','construction.materials.request' => 'crm.work_order.material.add',
            'construction.site_variations.approve' => 'crm.work_order.update','construction.practical_completion.record' => 'crm.work_order.update',
            'assurance.incidents.report' => 'crm.form.submit','assurance.inspections.complete' => 'crm.form.submit','field_services.onboarding.compile' => 'interaction.onboarding.compile',
            'field_services.onboarding.company.configure' => 'crm.business.profile.update','field_services.onboarding.profile.configure' => 'crm.business.profile.update',
            'field_services.onboarding.availability.configure' => 'crm.business.hours.update','field_services.onboarding.territory.configure' => 'crm.business.service_area.update',
            'field_services.onboarding.catalogue.configure' => 'crm.business.service.create','field_services.onboarding.booking.configure' => 'crm.business.booking_rules.update',
            'field_services.onboarding.payments.configure' => 'crm.business.payment_settings.update','field_services.onboarding.workforce.configure' => 'crm.staff.invite',
            'field_services.onboarding.customer_experience.configure' => 'crm.business.profile.update','field_services.onboarding.access.configure' => 'builder.features.update',
            'field_services.onboarding.communications.configure' => 'mobile.notification.configure','field_services.onboarding.ai.configure' => 'ai.business.preferences.update',
            'field_services.onboarding.integrations.configure' => 'builder.features.update','field_services.onboarding.brand.configure' => 'builder.brand.update',
            'field_services.onboarding.compliance.configure' => 'crm.business.compliance.update','field_services.onboarding.activate' => 'interaction.onboarding.activate',
        ],
        'providers' => [
            'crm' => ['optional' => true],
            'builder' => ['optional' => true],
            'chatbot' => ['optional' => true],
            'connect' => ['optional' => true],
            'mobile' => ['optional' => true],
            'titan_ai' => ['optional' => true],
        ],
    ],

    'company_context' => [
        // Titan platform company boundary: company_id. team_id/user_id are actor/group attributes only.
        'user_company_keys' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('INTERACTION_COMPANY_USER_KEYS', 'company_id'))
        ))),
    ],

    'template' => [
        'definitions_path' => env('INTERACTION_TEMPLATE_PATH', $extensionRoot . '/resources/templates'),
    ],

    'wizard' => [
        'definitions_path' => env('INTERACTION_WIZARD_PATH', $extensionRoot . '/resources/wizards'),
        'outbox_secret' => env('INTERACTION_OUTBOX_SECRET'),
        'default_renderer' => env('INTERACTION_WIZARD_RENDERER', 'hybrid'),
        'approval_threshold' => (float) env('INTERACTION_APPROVAL_THRESHOLD', 1000),
        'session_ttl' => (int) env('INTERACTION_WIZARD_SESSION_TTL', 86400),
        'onboarding_plan_ttl' => (int) env('INTERACTION_ONBOARDING_PLAN_TTL', 86400),
        'onboarding_ledger_ttl' => (int) env('INTERACTION_ONBOARDING_LEDGER_TTL', 604800),
    ],

    'intelligence_providers' => [
        'order' => ['deterministic','browser_llm','device_ai','byo_ai','cloud_ai'],
        'business_authority' => false,
        'browser_llm_direct_capability_execution' => false,
    ],

    'local_intelligence' => [
        'titan_apps' => ['owner' => 'titan-apps-suite', 'component' => 'interaction-engine', 'public' => true, 'canonical_surfaces' => ['zero','go','hub']],

    'enabled' => (bool) env('INTERACTION_LOCAL_INTELLIGENCE', true),
        'minimum_confidence' => (float) env('INTERACTION_LOCAL_MIN_CONFIDENCE', 0.65),
        'memory_limit' => (int) env('INTERACTION_LOCAL_MEMORY_LIMIT', 1000),
        'share_model_weights' => (bool) env('INTERACTION_SHARE_MODEL_WEIGHTS', false),
        'share_aggregate_counts' => (bool) env('INTERACTION_SHARE_AGGREGATES', false),
    ],

    'authority' => [
        'approval_secret' => env('INTERACTION_APPROVAL_SECRET'),
        'fresh_authentication_seconds' => (int) env('INTERACTION_FRESH_AUTH_SECONDS', 300),
        'default_deny' => true,
    ],

    'offline' => [
        'titan_apps' => ['owner' => 'titan-apps-suite', 'component' => 'interaction-engine', 'public' => true, 'canonical_surfaces' => ['zero','go','hub']],

    'enabled' => (bool) env('INTERACTION_OFFLINE_ENABLED', true),
        'health_check_url' => env('INTERACTION_HEALTH_CHECK_URL', config('app.url')),
        'sync_batch_size' => (int) env('INTERACTION_SYNC_BATCH_SIZE', 100),
        'max_attempts' => (int) env('INTERACTION_SYNC_MAX_ATTEMPTS', 5),
    ],
];
