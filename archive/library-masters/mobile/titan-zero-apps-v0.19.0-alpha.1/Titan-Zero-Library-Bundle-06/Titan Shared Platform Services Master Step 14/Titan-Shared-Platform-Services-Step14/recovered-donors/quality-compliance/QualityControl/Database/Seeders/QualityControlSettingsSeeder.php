<?php

namespace Modules\QualityControl\Database\Seeders;

use App\Models\Company;
use App\Models\Module;
use Illuminate\Database\Seeder;
use Modules\QualityControl\Entities\RecurringSchedule;

class QualityControlSettingsSeeder extends Seeder
{
    /** QC automation setting defaults (Phase 7). */
    private array $defaults = [
        'qc_auto_create_complaint_threshold' => 'high',
        'qc_reclean_deadline_hours'           => 24,
        'qc_corrective_action_sla_hours'      => 48,
        'qc_verification_reminder_hours'      => 24,
    ];

    public function run(): void
    {
        Module::query()->firstOrCreate(
            ['module_name' => 'quality_control'],
            ['is_superadmin' => 0, 'description' => 'Quality Control module']
        );

        if (!class_exists(Company::class)) {
            return;
        }

        Company::query()->select('id')->chunkById(100, function ($companies) {
            foreach ($companies as $company) {
                RecurringSchedule::addModuleSetting($company);
                $this->seedCompanyAutomationSettings($company->id);
            }
        });
    }

    private function seedCompanyAutomationSettings(int $companyId): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('module_settings')) {
            return;
        }

        foreach ($this->defaults as $key => $value) {
            try {
                \Illuminate\Support\Facades\DB::table('module_settings')->updateOrInsert(
                    [
                        'company_id'  => $companyId,
                        'module_name' => 'quality_control',
                        'setting_key' => $key,
                    ],
                    [
                        'setting_value' => $value,
                        'updated_at'    => now(),
                        'created_at'    => now(),
                    ]
                );
            } catch (\Throwable) {
                // Silent: module_settings schema may differ per deployment.
            }
        }
    }
}
