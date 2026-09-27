<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\System\Navigation;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class MapsMenuInstaller
{
    /** Icons already proven safe in the current Titan/MagicAI navbar stack. */
    private const HOST_SAFE_ICONS = [
        'tabler-layout-dashboard','tabler-users','tabler-folders','tabler-device-mobile','tabler-photo',
        'tabler-palette','tabler-plug-connected','tabler-shield-lock','tabler-settings','tabler-command',
        'tabler-directions','tabler-tool','tabler-components','tabler-category','tabler-stethoscope',
        'tabler-inbox','tabler-message-cog','tabler-message','tabler-phone-call','tabler-bell-ringing',
        'tabler-users-group','tabler-world','tabler-user-check','tabler-user-question','tabler-hand-stop',
        'tabler-archive','tabler-address-book','tabler-building','tabler-coin','tabler-briefcase',
        'tabler-checklist','tabler-calendar','tabler-presentation','tabler-chart-bar','tabler-receipt',
        'tabler-file-invoice','tabler-cash','tabler-file-text','tabler-calculator',
    ];

    public static function sync(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }

        $columns = array_flip(Schema::getColumnListing('menus'));
        if (! isset($columns['key'])) {
            return;
        }

        self::syncDefinition(MapsMenuDefinition::user(), $columns, isset($columns['is_admin']) ? 0 : null);

        if (isset($columns['is_admin'])) {
            self::syncDefinition(MapsMenuDefinition::admin(), $columns, 1);
        } else {
            // Older MagicAI hosts use a shared menu table without an admin discriminator.
            // Follow the proven Titan fallback: expose a single Maps admin entry under the existing Settings parent.
            self::syncAdminSettingsFallback($columns);
        }

        self::invalidateHostMenuCache();
    }

    public static function deactivate(): void
    {
        if (! Schema::hasTable('menus') || ! Schema::hasColumn('menus', 'key')) {
            return;
        }

        $keys = array_values(array_unique(array_merge(MapsMenuDefinition::userKeys(), MapsMenuDefinition::adminKeys(), ['titan_maps_admin_settings'])));
        if (Schema::hasColumn('menus', 'is_active')) {
            $updates = ['is_active' => 0];
            if (Schema::hasColumn('menus', 'updated_at')) {
                $updates['updated_at'] = now();
            }
            DB::table('menus')->whereIn('key', $keys)->update($updates);
        }
        self::invalidateHostMenuCache();
    }

    /** @param array<int,array<string,mixed>> $definition @param array<string,int> $columns */
    private static function syncDefinition(array $definition, array $columns, ?int $isAdmin): void
    {
        foreach ($definition as $root) {
            self::upsert($root, null, $columns, $isAdmin);
            $parentId = isset($columns['id']) ? DB::table('menus')->where('key', $root['key'])->value('id') : null;
            if ($parentId === null && ($root['children'] ?? []) !== []) {
                continue;
            }
            foreach ($root['children'] ?? [] as $index => $child) {
                $child['order'] = $child['order'] ?? ($index + 1);
                self::upsert($child, $parentId, $columns, $isAdmin);
            }
        }
    }

    /** @param array<string,mixed> $item @param array<string,int> $columns */
    private static function upsert(array $item, mixed $parentId, array $columns, ?int $isAdmin): void
    {
        $data = [
            'parent_id' => $parentId,
            'route' => $item['route'] ?? null,
            'route_slug' => null,
            'label' => $item['label'] ?? $item['key'],
            'icon' => self::safeIcon((string) ($item['icon'] ?? '')),
            'svg' => null,
            'order' => (int) ($item['order'] ?? 0),
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
            'is_admin' => $isAdmin,
            'updated_at' => now(),
            'custom_menu' => 0,
        ];
        $data = array_intersect_key($data, $columns);
        if ($isAdmin === null) {
            unset($data['is_admin']);
        }

        $query = DB::table('menus')->where('key', $item['key']);
        if ($query->exists()) {
            $query->update($data);
            return;
        }

        $insert = ['key' => $item['key']] + $data;
        if (isset($columns['created_at'])) {
            $insert['created_at'] = now();
        }
        DB::table('menus')->insert(array_intersect_key($insert, $columns));
    }

    /** @param array<string,int> $columns */
    private static function syncAdminSettingsFallback(array $columns): void
    {
        if (! isset($columns['id'])) {
            return;
        }
        $settingsParentId = DB::table('menus')->where('key', 'settings')->value('id');
        if ($settingsParentId === null) {
            return;
        }
        self::upsert([
            'key' => 'titan_maps_admin_settings',
            'label' => 'Titan Maps Intelligence',
            'route' => 'dashboard.admin.titan-maps-intelligence.navigation.index',
            'order' => 90,
            'icon' => 'tabler-world',
        ], $settingsParentId, $columns, null);
    }

    private static function safeIcon(string $icon): string
    {
        return in_array($icon, self::HOST_SAFE_ICONS, true) ? $icon : 'tabler-folders';
    }

    private static function invalidateHostMenuCache(): void
    {
        if (! class_exists(\App\Services\Common\MenuService::class)) {
            return;
        }
        try {
            $service = app(\App\Services\Common\MenuService::class);
            if (method_exists($service, 'regenerate')) {
                $service->regenerate();
            }
        } catch (\Throwable) {
            // Persisted rows are authoritative; cache refresh must never block extension install/upgrade.
        }
    }
}
