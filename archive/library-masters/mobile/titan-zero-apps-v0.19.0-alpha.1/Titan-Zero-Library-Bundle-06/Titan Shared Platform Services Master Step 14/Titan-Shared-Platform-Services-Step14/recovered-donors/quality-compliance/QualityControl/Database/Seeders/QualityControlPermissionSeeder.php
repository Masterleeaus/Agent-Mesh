<?php

namespace Modules\QualityControl\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class QualityControlPermissionSeeder extends Seeder
{
    public function run(): void
    {
        if (!Schema::hasTable('permissions')) {
            return;
        }

        $manifest = include module_path('QualityControl', 'manifests/permissions.php');
        $all = array_values(array_unique(array_merge(
            $manifest['permissions'] ?? [],
            $manifest['legacy_aliases'] ?? []
        )));

        $columns = Schema::getColumnListing('permissions');
        $hasGuardName = in_array('guard_name', $columns, true);

        foreach ($all as $permission) {
            $payload = [
                'name' => $permission,
                'display_name' => ucwords(str_replace(['_', '.'], ' ', $permission)),
            ];

            if ($hasGuardName) {
                $payload['guard_name'] = 'web';
            }

            if (in_array('updated_at', $columns, true)) {
                $payload['updated_at'] = now();
            }

            if (in_array('created_at', $columns, true)) {
                $payload['created_at'] = now();
            }

            DB::table('permissions')->updateOrInsert(['name' => $permission], $payload);
        }
    }
}
