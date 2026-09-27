<?php

namespace Modules\QualityControl\Database\Seeders;

use Illuminate\Database\Seeder;

class InspectionPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(QualityControlPermissionSeeder::class);
    }
}
