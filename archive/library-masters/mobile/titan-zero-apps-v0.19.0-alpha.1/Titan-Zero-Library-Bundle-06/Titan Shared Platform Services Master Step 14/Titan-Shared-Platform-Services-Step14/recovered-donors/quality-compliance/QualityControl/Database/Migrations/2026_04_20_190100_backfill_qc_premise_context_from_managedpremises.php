<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('qc_records') || !Schema::hasTable('pm_property_inspections')) {
            return;
        }

        DB::table('pm_property_inspections')
            ->select('id', 'company_id', 'property_id')
            ->orderBy('id')
            ->chunkById(200, function ($legacyRows): void {
                $hasLegacyPmId = Schema::hasColumn('qc_records', 'legacy_pm_property_inspection_id');
                $hasLegacyId = Schema::hasColumn('qc_records', 'legacy_inspection_id');

                if (!$hasLegacyPmId && !$hasLegacyId) {
                    return;
                }

                foreach ($legacyRows as $legacy) {
                    $query = DB::table('qc_records')
                        ->where('company_id', $legacy->company_id)
                        ->whereNull('property_id')
                        ->where(function ($q) use ($legacy, $hasLegacyPmId, $hasLegacyId) {
                            if ($hasLegacyPmId) {
                                $q->where('legacy_pm_property_inspection_id', $legacy->id);
                            }

                            if ($hasLegacyId) {
                                $q->orWhere('legacy_inspection_id', $legacy->id);
                            }
                        });

                    $query->update([
                        'property_id' => $legacy->property_id,
                        'legacy_pm_property_inspection_id' => $legacy->id,
                        'updated_at' => now(),
                    ]);
                }
            });
    }

    public function down(): void
    {
        // Data backfill migration is intentionally non-destructive.
    }
};
