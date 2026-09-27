<?php

$moduleConfig = require __DIR__.'/app-modules.generated.php';

return $moduleConfig + [
    'surfaces' => [
        'zero' => ['app_id'=>'titan-apps-zero','display_name'=>'Titan Zero'],
        'go' => ['app_id'=>'titan-apps-go','display_name'=>'Titan Go'],
        'hub' => ['app_id'=>'titan-apps-hub','display_name'=>'Titan Hub'],
    ],
    'applications' => [
        'zero' => [
            'app_id'=>'titan-apps-zero',
            'display_name'=>'Titan Zero',
            'interface_mount'=>'zero-workspace',
            'pwa'=>true,
            'offline_capable'=>true,
            'input_modes'=>['text','voice','vision','touch','attachment'],
        ],
        'go' => [
            'app_id'=>'titan-apps-go',
            'display_name'=>'Titan Go',
            'interface_mount'=>'go-workspace',
            'pwa'=>true,
            'offline_capable'=>true,
            'input_modes'=>['text','voice','vision','touch','attachment'],
        ],
        'hub' => [
            'app_id'=>'titan-apps-hub',
            'display_name'=>'Titan Hub',
            'interface_mount'=>'hub-workspace',
            'pwa'=>true,
            'offline_capable'=>true,
            'input_modes'=>['text','voice','vision','touch','attachment'],
        ],
    ],

    'aliases' => [
        'bos'=>'zero','command'=>'zero','owner'=>'zero','manager'=>'zero','business'=>'zero',
        'field'=>'go','worker'=>'go','customer'=>'hub',
    ],
    'journeys' => [
        'onboarding' => ['surface'=>'zero'],
    ],
    'runtime_dependencies' => [
        'interaction-engine' => [
            'required'=>true,
            'contracts'=>[
                'App\Extensions\InteractionEngine\System\Contracts\PublicInteractionEngineInterface',
                'App\Extensions\InteractionEngine\System\Contracts\PresentationIntentPlannerInterface',
                'App\Extensions\InteractionEngine\System\Contracts\InteractionContextFactoryInterface',
                'App\Extensions\InteractionEngine\System\Contracts\InteractionEngineManagerContract',
                'App\Extensions\InteractionEngine\System\Contracts\GovernedOperationActivityGatewayInterface',
            ],
        ],
        'interface-runtime' => [
            'required'=>true,
            'contracts'=>[
                'App\Extensions\TitanInterfaceRuntime\System\Contracts\InterfaceRuntime',
                'App\Extensions\TitanInterfaceRuntime\System\Contracts\InterfaceContributionRegistry',
                'App\Extensions\TitanInterfaceRuntime\System\Contracts\ActionIntentDispatcher',
            ],
        ],
        'builder' => [
            'required'=>false,
            'contracts'=>[
                'App\Extensions\TitanBuilder\System\Contracts\ComponentRegistry',
                'App\Extensions\TitanBuilder\System\Contracts\SurfaceRegistry',
            ],
        ],
        'visual-runtime' => [
            'required'=>true,
            'contracts'=>[
                'App\Extensions\TitanVisualRuntime\System\Contracts\VisualRuntime',
                'App\Extensions\TitanVisualRuntime\System\Contracts\VisualContributionRegistry',
                'App\Extensions\TitanVisualRuntime\System\Contracts\VisualContributionResolver',
            ],
        ],
    ],
    'public_services' => [
        'core' => [
            'owner'=>'Titan Apps: Core',
            'platform_accessible'=>true,
            'contracts'=>[
                'App\\Extensions\\TitanAppsCore\\System\\Contracts\\AppLifecycle',
                'App\\Extensions\\TitanAppsCore\\System\\Contracts\\AppSurface',
            ],
        ],
        'interaction-engine' => [
            'owner'=>'Titan Apps: Interaction Engine',
            'platform_accessible'=>true,
            'contracts'=>[
                'App\\Extensions\\InteractionEngine\\System\\Contracts\\PublicInteractionEngineInterface',
                'App\\Extensions\\InteractionEngine\\System\\Contracts\\PresentationIntentPlannerInterface',
                'App\\Extensions\\InteractionEngine\\System\\Contracts\\InteractionContextFactoryInterface',
                'App\\Extensions\\InteractionEngine\\System\\Contracts\\InteractionEngineManagerContract',
            ],
        ],
        'interface-runtime' => [
            'owner'=>'Titan Apps: Interface Runtime',
            'platform_accessible'=>true,
            'contracts'=>[
                'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\InterfaceRuntime',
                'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\InterfaceContributionRegistry',
                'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\ActionIntentDispatcher',
            ],
        ],
        'builder' => [
            'owner'=>'Titan Apps: Builder',
            'platform_accessible'=>true,
            'contracts'=>[
                'App\\Extensions\\TitanBuilder\\System\\Contracts\\ComponentRegistry',
                'App\\Extensions\\TitanBuilder\\System\\Contracts\\SurfaceRegistry',
                'App\\Extensions\\TitanAppsBuilder\\System\\Contracts\\ComponentRegistry',
                'App\\Extensions\\TitanAppsBuilder\\System\\Contracts\\SurfaceRegistry',
            ],
        ],
        'visual-runtime' => [
            'owner'=>'Titan Apps: Visual Runtime',
            'platform_accessible'=>true,
            'contracts'=>[
                'App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime',
                'App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualContributionRegistry',
                'App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualContributionResolver',
            ],
        ],
    ],

    'workspace_sections' => [
        'zero' => [
            ['id'=>'zero','label'=>'Zero','icon'=>'0','modules'=>['zero','dashboard'],'default'=>true],
            ['id'=>'work','label'=>'Work','icon'=>'▣','modules'=>['jobs','workforce']],
            ['id'=>'inbox','label'=>'Inbox','icon'=>'✉','modules'=>['inbox']],
            ['id'=>'more','label'=>'More','icon'=>'☷','modules'=>[]],
        ],
        'go' => [
            ['id'=>'today','label'=>'Today','icon'=>'●','modules'=>['today'],'default'=>true],
            ['id'=>'work','label'=>'Work','icon'=>'▣','modules'=>['jobs','schedule']],
            ['id'=>'go','label'=>'Go','icon'=>'↗','modules'=>['go']],
            ['id'=>'inbox','label'=>'Inbox','icon'=>'✉','modules'=>['inbox']],
            ['id'=>'more','label'=>'More','icon'=>'☷','modules'=>[]],
        ],
        'hub' => [
            ['id'=>'home','label'=>'Home','icon'=>'⌂','modules'=>['home'],'default'=>true],
            ['id'=>'bookings','label'=>'Bookings','icon'=>'◷','modules'=>['bookings']],
            ['id'=>'hub','label'=>'Hub','icon'=>'◉','modules'=>['hub']],
            ['id'=>'inbox','label'=>'Inbox','icon'=>'✉','modules'=>['inbox']],
            ['id'=>'more','label'=>'More','icon'=>'☷','modules'=>[]],
        ],
    ],

    'offline' => [
        'local_first'=>true,
        'queue_capability_intents'=>true,
        'preserve_idempotency'=>true,
        'preserve_actor_company_context'=>true,
        'conflict_policy'=>'explicit',
    ],
];
