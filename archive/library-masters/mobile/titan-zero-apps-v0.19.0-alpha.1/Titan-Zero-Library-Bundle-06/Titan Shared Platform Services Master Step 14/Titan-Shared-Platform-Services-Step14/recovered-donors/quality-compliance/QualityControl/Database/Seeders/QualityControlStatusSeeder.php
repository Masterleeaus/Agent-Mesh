<?php

namespace Modules\QualityControl\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class QualityControlStatusSeeder extends Seeder
{
    public function run(): void
    {
        if (!Schema::hasTable('qc_status_catalog')) {
            return;
        }

        $defaults = [
            'qc_status' => ['pending', 'pass', 'fail', 'reclean_required', 'reclean_done', 'closed'],
            'inspection_outcome' => ['pending', 'pass', 'fail', 'needs_reclean', 'escalated'],
            'severity_level' => ['low', 'medium', 'high', 'critical'],
            'reclean_status' => ['requested', 'scheduled', 'completed', 'verified', 'failed_again', 'escalated'],
            'corrective_action_status' => ['open', 'in_progress', 'blocked', 'resolved', 'verified'],
            'template_category' => ['general', 'cleaning', 'sanitization', 'handover'],
        ];

        foreach ($defaults as $type => $keys) {
            foreach ($keys as $sort => $key) {
                DB::table('qc_status_catalog')->updateOrInsert(
                    [
                        'company_id' => null,
                        'type' => $type,
                        'key' => $key,
                    ],
                    [
                        'label' => ucwords(str_replace('_', ' ', $key)),
                        'sort_order' => $sort,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }
}
