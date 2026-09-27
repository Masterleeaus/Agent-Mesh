<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $now = now();

            // 1) Ensure Jobs parent
            $jobsParentKey = 'jobs_label';
            $jobsParentId = DB::table('menus')->where('key', $jobsParentKey)->value('id');

            if (!$jobsParentId) {
                DB::table('menus')->insert([
                    'parent_id' => null,
                    'key' => $jobsParentKey,
                    'route' => null,
                    'route_slug' => null,
                    'label' => 'Jobs',
                    'icon' => 'tabler-briefcase',
                    'svg' => null,
                    'order' => 50,
                    'is_active' => 1,
                    'params' => '[]',
                    'evidence_type' => 'label',
                    'extension' => null,
                    'bolt_menu' => 1,
                    'bolt_background' => null,
                    'bolt_foreground' => null,
                    'letter_icon' => 0,
                    'letter_icon_bg' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'custom_menu' => 0,
                ]);
                $jobsParentId = DB::table('menus')->where('key', $jobsParentKey)->value('id');
            }

            // 2) Ensure Tools/Media parent
            $toolsParentKey = 'tools_media_label';
            $toolsParentId = DB::table('menus')->where('key', $toolsParentKey)->value('id');

            if (!$toolsParentId) {
                DB::table('menus')->insert([
                    'parent_id' => null,
                    'key' => $toolsParentKey,
                    'route' => null,
                    'route_slug' => null,
                    'label' => 'Tools & Media',
                    'icon' => 'tabler-tool',
                    'svg' => null,
                    'order' => 55,
                    'is_active' => 1,
                    'params' => '[]',
                    'evidence_type' => 'label',
                    'extension' => null,
                    'bolt_menu' => 1,
                    'bolt_background' => null,
                    'bolt_foreground' => null,
                    'letter_icon' => 0,
                    'letter_icon_bg' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'custom_menu' => 0,
                ]);
                $toolsParentId = DB::table('menus')->where('key', $toolsParentKey)->value('id');
            }

            // 3) Jobs -> Evidence
            $jobsItemKey = 'jobs_evidence';
            $jobsItem = [
                'parent_id' => $jobsParentId,
                'key' => $jobsItemKey,
                'route' => 'dashboard.user.titan-trust.index',
                'route_slug' => null,
                'label' => 'Evidence',
                'icon' => 'tabler-camera',
                'svg' => null,
                'order' => 56,
                'is_active' => 1,
                'params' => '[]',
                'evidence_type' => 'item',
                'extension' => 'titan-trust',
                'bolt_menu' => 1,
                'bolt_background' => null,
                'bolt_foreground' => null,
                'letter_icon' => 0,
                'letter_icon_bg' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'custom_menu' => 0,
            ];

            if (DB::table('menus')->where('key', $jobsItemKey)->exists()) {
                DB::table('menus')->where('key', $jobsItemKey)->update(array_merge($jobsItem, ['updated_at' => $now]));
            } else {
                DB::table('menus')->insert($jobsItem);
            }

            // 4) Tools/Media -> Work Gallery (shortcut)
            $toolsItemKey = 'tools_work_gallery';
            $toolsItem = [
                'parent_id' => $toolsParentId,
                'key' => $toolsItemKey,
                'route' => 'dashboard.user.titan-trust.index',
                'route_slug' => null,
                'label' => 'Work Gallery',
                'icon' => 'tabler-photo',
                'svg' => null,
                'order' => 12,
                'is_active' => 1,
                'params' => '[]',
                'evidence_type' => 'item',
                'extension' => 'titan-trust',
                'bolt_menu' => 1,
                'bolt_background' => null,
                'bolt_foreground' => null,
                'letter_icon' => 0,
                'letter_icon_bg' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'custom_menu' => 0,
            ];

            if (DB::table('menus')->where('key', $toolsItemKey)->exists()) {
                DB::table('menus')->where('key', $toolsItemKey)->update(array_merge($toolsItem, ['updated_at' => $now]));
            } else {
                DB::table('menus')->insert($toolsItem);
            }

            // Ensure bolt menu flags are set on parents
            DB::table('menus')->whereIn('key', [$jobsParentKey, $toolsParentKey])->update(['bolt_menu' => 1, 'updated_at' => $now]);
        });
    }

    public function down(): void
    {
        DB::transaction(function () {
            DB::table('menus')->whereIn('key', ['jobs_evidence', 'tools_work_gallery'])->delete();
            // Keep parents (jobs_label, tools_media_label) to avoid nuking existing structures
        });
    }
};
