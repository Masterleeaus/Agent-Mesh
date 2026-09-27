<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Host;

final class TitanInterfaceRuntimeMenuContributor
{
    public const USER_PARENT = 'titan_interface_runtime';

    /** @return list<array<string,mixed>> */
    public function user(): array
    {
        return self::definitions();
    }

    /** @return list<array<string,mixed>> */
    public function admin(): array
    {
        return [];
    }

    /** @return list<array<string,mixed>> */
    public static function definitions(): array
    {
        return [
            self::item(null, self::USER_PARENT, 'dashboard.user.titan.interface.runtime.index', 'Titan Interface Runtime', 95, 'tabler-components'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_overview', 'dashboard.user.titan.interface.runtime.index', 'Overview', 1, 'tabler-layout-dashboard'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_explore', 'dashboard.user.titan.interface.runtime.menu.page', 'Explore', 2, 'tabler-folders', 'explore'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_commands', 'dashboard.user.titan.interface.runtime.menu.page', 'Command Surface', 3, 'tabler-command', 'commands'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_continue', 'dashboard.user.titan.interface.runtime.menu.page', 'Continue', 4, 'tabler-folders', 'continue'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_attention', 'dashboard.user.titan.interface.runtime.menu.page', 'Attention', 5, 'tabler-folders', 'attention'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_approvals', 'dashboard.user.titan.interface.runtime.menu.page', 'Approvals', 6, 'tabler-folders', 'approvals'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_inbox', 'dashboard.user.titan.interface.runtime.menu.page', 'Inbox', 7, 'tabler-folders', 'inbox'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_sync', 'dashboard.user.titan.interface.runtime.menu.page', 'Sync', 8, 'tabler-folders', 'sync'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_workspaces', 'dashboard.user.titan.interface.runtime.menu.page', 'Object Workspaces', 9, 'tabler-components', 'workspaces'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_collections', 'dashboard.user.titan.interface.runtime.menu.page', 'Collections', 10, 'tabler-layout-dashboard', 'collections'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_spatial', 'dashboard.user.titan.interface.runtime.menu.page', 'Spatial', 11, 'tabler-folders', 'spatial'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_decisions', 'dashboard.user.titan.interface.runtime.menu.page', 'Decisions', 12, 'tabler-components', 'decisions'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_governance', 'dashboard.user.titan.interface.runtime.menu.page', 'Governance', 13, 'tabler-components', 'governance'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_working_sets', 'dashboard.user.titan.interface.runtime.menu.page', 'Working Sets', 14, 'tabler-folders', 'working-sets'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_configuration', 'dashboard.user.titan.interface.runtime.menu.page', 'Configuration', 15, 'tabler-components', 'configuration'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_experience', 'dashboard.user.titan.interface.runtime.menu.page', 'Experience', 16, 'tabler-components', 'experience'),
            self::item(self::USER_PARENT, 'titan_interface_runtime_surfaces', 'dashboard.user.titan.interface.runtime.menu.page', 'Product Surfaces', 17, 'tabler-layout-dashboard', 'surfaces'),
        ];
    }

    /** @return array<string,mixed> */
    public static function definition(): array
    {
        return self::definitions()[0];
    }

    /** @return list<string> */
    public static function keys(): array
    {
        return array_values(array_map(static fn (array $definition): string => (string) $definition['key'], self::definitions()));
    }

    /** @return array<string,mixed> */
    private static function item(
        ?string $parentKey,
        string $key,
        string $route,
        string $label,
        int $order,
        string $icon,
        ?string $routeSlug = null,
    ): array {
        return [
            'parent_key'=>$parentKey,
            'key'=>$key,
            'route'=>$route,
            'route_slug'=>$routeSlug,
            'label'=>$label,
            'icon'=>$icon,
            'order'=>$order,
            'is_active'=>true,
            'type'=>'item',
            'active_condition'=>[$route],
            'show_condition'=>true,
        ];
    }
}
