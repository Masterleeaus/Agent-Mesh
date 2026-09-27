<?php

return [
    'database' => \Modules\QualityControl\Database\Seeders\QualityControlDatabaseSeeder::class,
    'seeders' => [
        \Modules\QualityControl\Database\Seeders\QualityControlPermissionSeeder::class,
        \Modules\QualityControl\Database\Seeders\QualityControlStatusSeeder::class,
        \Modules\QualityControl\Database\Seeders\QualityControlSettingsSeeder::class,
        \Modules\QualityControl\Database\Seeders\InspectionTemplateSeeder::class,
    ],
];
