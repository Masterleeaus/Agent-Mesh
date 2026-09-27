<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\TitanShell;

final class TemplateNavigation
{
    private const SHARED_DRAWER = [
        ['id' => 'search', 'label' => 'Search', 'icon' => 'search'],
        ['id' => 'recent', 'label' => 'Recent', 'icon' => 'history'],
        ['id' => 'knowledge', 'label' => 'Knowledge', 'icon' => 'book'],
        ['id' => 'files', 'label' => 'Files', 'icon' => 'files'],
        ['id' => 'notifications', 'label' => 'Notifications', 'icon' => 'bell'],
    ];

    public static function resolve(?string $slug): array
    {
        $schema = TemplateSchema::resolve($slug);
        return [
            'slug' => $schema['identity']['slug'],
            'name' => $schema['identity']['name'],
            'default_view' => $schema['navigation']['default_view'],
            'primary' => $schema['navigation']['primary'],
            'drawer' => array_merge($schema['navigation']['drawer'], self::SHARED_DRAWER),
            'schema' => $schema,
            'settings' => [
                'business-data' => 'Business Data',
                'crm' => 'CRM',
                'ai' => 'AI',
                'communications' => 'Communications',
                'mobile' => 'Mobile',
                'privacy' => 'Privacy',
                'permissions' => 'Permissions',
                'notifications' => 'Notifications',
                'appearance' => 'Appearance',
                'accessibility' => 'Accessibility',
                'diagnostics' => 'Diagnostics',
            ],
        ];
    }
}
