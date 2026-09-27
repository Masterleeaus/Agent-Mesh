<?php

namespace App\Extensions\TitanTrust\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Idempotent menu seeder for TitanTrust.
 * HARD RULE: No core menu architecture changes — only inserts/updates rows.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // Menus table structure expected (from platform):
        // id, parent_id, key, route, route_slug, label, icon, order, is_active, params, type, extension, bolt_menu, ...
        $now = now();

        $jobsParentId = DB::table('menus')->where('key', 'jobs')->value('id');

        // If a Jobs parent menu doesn't exist yet, create it (idempotent).
        if (!$jobsParentId) {
            $jobsParentId = DB::table('menus')->insertGetId([
                'parent_id' => null,
                'key' => 'jobs',
                'route' => null,
                'route_slug' => null,
                'label' => 'Jobs',
                'icon' => 'briefcase',
                'order' => 30,
                'is_active' => 1,
                'params' => null,
                'type' => 'label',
                'extension' => null,
                'bolt_menu' => 1,
                'bolt_background' => null,
                'bolt_foreground' => null,
                'letter_icon' => 0,
                'letter_icon_bg' => null,
                'custom_menu' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $items = [
            [
                'key' => 'jobs.verify',
                'label' => 'Verify',
                'icon' => 'shield-check',
                'route' => 'dashboard.user.titan-trust.index',
                'order' => 10,
            ],
            [
                'key' => 'jobs.verify.gallery',
                'label' => 'Evidence Gallery',
                'icon' => 'images',
                'route' => 'dashboard.user.titan-trust.gallery',
                'order' => 20,
            ],
            [
                'key' => 'jobs.verify.incidents',
                'label' => 'Incidents',
                'icon' => 'alert-triangle',
                'route' => 'dashboard.user.titan-trust.incidents',
                'order' => 30,
            ],
        ];

        foreach ($items as $m) {
            $existing = DB::table('menus')->where('key', $m['key'])->first();

            $payload = [
                'parent_id' => (int) $jobsParentId,
                'key' => $m['key'],
                'route' => $m['route'],
                'route_slug' => null,
                'label' => $m['label'],
                'icon' => $m['icon'],
                'svg' => null,
                'order' => $m['order'],
                'is_active' => 1,
                'params' => null,
                'type' => 'item',
                'extension' => 'TitanTrust',
                'bolt_menu' => 1,
                'bolt_background' => null,
                'bolt_foreground' => null,
                'letter_icon' => 0,
                'letter_icon_bg' => null,
                'custom_menu' => 0,
                'updated_at' => $now,
            ];

            if ($existing) {
                DB::table('menus')->where('id', $existing->id)->update($payload);
            } else {
                $payload['created_at'] = $now;
                DB::table('menus')->insert($payload);
            }
        }
    }
}
