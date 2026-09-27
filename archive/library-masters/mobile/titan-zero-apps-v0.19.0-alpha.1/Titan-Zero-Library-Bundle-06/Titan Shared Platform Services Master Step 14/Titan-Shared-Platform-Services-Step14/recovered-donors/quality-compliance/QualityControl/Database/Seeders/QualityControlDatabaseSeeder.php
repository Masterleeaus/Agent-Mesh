<?php

namespace Modules\QualityControl\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;

class QualityControlDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Model::unguard();

        $this->call(QualityControlPermissionSeeder::class);
        $this->call(QualityControlStatusSeeder::class);
        $this->call(QualityControlSettingsSeeder::class);
        $this->call(InspectionTemplateSeeder::class);
        $this->call(InspectionModuleSeeder::class);
    }
}
