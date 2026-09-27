<?php

namespace Modules\QualityControl\Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use Modules\QualityControl\Entities\RecurringSchedule;

class InspectionModuleSeeder extends Seeder
{
    public function run(): void
    {
        if (!class_exists(Company::class)) {
            return;
        }

        Company::query()->select('id')->chunkById(100, function ($companies) {
            foreach ($companies as $company) {
                RecurringSchedule::addModuleSetting($company);
            }
        });
    }
}
