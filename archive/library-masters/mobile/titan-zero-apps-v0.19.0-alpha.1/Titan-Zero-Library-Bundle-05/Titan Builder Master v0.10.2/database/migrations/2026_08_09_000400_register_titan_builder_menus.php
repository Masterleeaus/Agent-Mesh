<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var list<string> */
    private const MENU_KEYS = [
        'titan_builder',
        'titan_builder_overview',
        'titan_builder_projects',
        'titan_builder_applications',
        'titan_builder_hub',
        'titan_builder_go',
        'titan_builder_command',
        'titan_builder_onboarding',
        'titan_builder_assets',
        'titan_builder_brand',
        'titan_builder_integrations',
        'titan_builder_permissions',
        'titan_builder_settings',
        'titan_builder_admin',
        'titan_builder_admin_overview',
        'titan_builder_admin_integrations',
        'titan_builder_admin_registry',
        'titan_builder_admin_verticals',
        'titan_builder_admin_permissions',
        'titan_builder_admin_diagnostics',
        'titan_builder_admin_settings',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        $this->upsertMenu('titan_builder', null, 'titan-builder.manage.dashboard', 'Titan Builder', 'tabler-layout-grid', 24);
        $userParentId = $this->menuId('titan_builder');

        $this->upsertMenu('titan_builder_overview', $userParentId, 'titan-builder.manage.dashboard', 'Overview', 'tabler-layout-dashboard', 1);
        $this->upsertMenu('titan_builder_projects', $userParentId, 'titan-builder.manage.projects', 'Projects', 'tabler-folders', 2);
        $this->upsertMenu('titan_builder_applications', $userParentId, 'titan-builder.manage.applications', 'Applications', 'tabler-device-mobile', 3);
        $applicationsParentId = $this->menuId('titan_builder_applications');
        $this->upsertMenu('titan_builder_hub', $applicationsParentId, 'titan-builder.manage.application.hub', 'Titan Hub', 'tabler-users', 1);
        $this->upsertMenu('titan_builder_go', $applicationsParentId, 'titan-builder.manage.application.go', 'Titan Go', 'tabler-briefcase', 2);
        $this->upsertMenu('titan_builder_command', $applicationsParentId, 'titan-builder.manage.application.command', 'Titan Command', 'tabler-command', 3);
        $this->upsertMenu('titan_builder_onboarding', $applicationsParentId, 'titan-builder.manage.application.onboarding', 'Titan Onboarding', 'tabler-directions', 4);
        $this->upsertMenu('titan_builder_assets', $userParentId, 'titan-builder.manage.assets', 'Assets', 'tabler-photo', 4);
        $this->upsertMenu('titan_builder_brand', $userParentId, 'titan-builder.manage.brand', 'Brand & Theme', 'tabler-palette', 5);
        $this->upsertMenu('titan_builder_integrations', $userParentId, 'titan-builder.manage.integrations', 'Integrations', 'tabler-plug-connected', 6);
        $this->upsertMenu('titan_builder_permissions', $userParentId, 'titan-builder.manage.permissions', 'Permissions', 'tabler-shield-lock', 7);
        $this->upsertMenu('titan_builder_settings', $userParentId, 'titan-builder.manage.settings', 'Settings', 'tabler-settings', 8);

        // Admin entries share MagicAI's menus table. Their dashboard.admin-style route
        // placement plus host authorization keeps them in the Admin section for admins.
        $this->upsertMenu('titan_builder_admin', null, 'titan-builder.admin.dashboard', 'Titan Builder', 'tabler-tool', 33);
        $adminParentId = $this->menuId('titan_builder_admin');
        $this->upsertMenu('titan_builder_admin_overview', $adminParentId, 'titan-builder.admin.dashboard', 'Overview', 'tabler-layout-dashboard', 1);
        $this->upsertMenu('titan_builder_admin_integrations', $adminParentId, 'titan-builder.admin.integrations', 'Integrations', 'tabler-plug-connected', 2);
        $this->upsertMenu('titan_builder_admin_registry', $adminParentId, 'titan-builder.admin.registry', 'Registry', 'tabler-components', 3);
        $this->upsertMenu('titan_builder_admin_verticals', $adminParentId, 'titan-builder.admin.verticals', 'Vertical Packs', 'tabler-category', 4);
        $this->upsertMenu('titan_builder_admin_permissions', $adminParentId, 'titan-builder.admin.permissions', 'Permissions', 'tabler-shield-lock', 5);
        $this->upsertMenu('titan_builder_admin_diagnostics', $adminParentId, 'titan-builder.admin.diagnostics', 'Diagnostics', 'tabler-stethoscope', 6);
        $this->upsertMenu('titan_builder_admin_settings', $adminParentId, 'titan-builder.admin.settings', 'Settings', 'tabler-settings', 7);
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        // Delete children before parents without relying on foreign-key cascade behavior.
        DB::table('menus')->whereIn('key', array_reverse(self::MENU_KEYS))->delete();
    }

    private function upsertMenu(string $key, ?int $parentId, string $route, string $label, string $icon, int $order): void
    {
        $now = now();
        $payload = [
            'parent_id' => $parentId,
            'route' => $route,
            'route_slug' => null,
            'label' => $label,
            'icon' => $icon,
            'svg' => null,
            'order' => $order,
            'is_active' => 1,
            'params' => '[]',
            'type' => 'item',
            'badge' => null,
            'extension' => '1',
            'bolt_menu' => 0,
            'bolt_background' => null,
            'bolt_foreground' => null,
            'letter_icon' => 0,
            'letter_icon_bg' => null,
            'updated_at' => $now,
            'custom_menu' => 0,
        ];

        if (! DB::table('menus')->where('key', $key)->exists()) {
            $payload['created_at'] = $now;
        }

        DB::table('menus')->updateOrInsert(['key' => $key], $payload);
    }

    private function menuId(string $key): int
    {
        $id = DB::table('menus')->where('key', $key)->value('id');
        if (! is_numeric($id) || (int) $id <= 0) {
            throw new RuntimeException("Titan Builder failed to register menu key [{$key}].");
        }

        return (int) $id;
    }
};
