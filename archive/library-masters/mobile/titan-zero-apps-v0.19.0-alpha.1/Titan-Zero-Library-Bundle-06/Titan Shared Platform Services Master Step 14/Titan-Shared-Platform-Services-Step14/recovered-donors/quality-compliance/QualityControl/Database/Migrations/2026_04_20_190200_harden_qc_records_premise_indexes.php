<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Hardens the qc_records table by ensuring all premise-context and tenant-scoping
 * columns have indexes. Additive only — does not drop or modify existing columns.
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('qc_records')) {
            return;
        }

        Schema::table('qc_records', function (Blueprint $table) {
            // Ensure company_id has an index (it may already exist from the original migration)
            if (Schema::hasColumn('qc_records', 'company_id') && !$this->indexExists('qc_records', 'qc_records_company_id_index')) {
                $table->index('company_id', 'qc_records_company_id_index');
            }

            // property_id / unit_id / room_id / visit_id are indexed in the
            // 2026_04_20_190000 migration when added, so only add if somehow missing.
            if (Schema::hasColumn('qc_records', 'property_id') && !$this->indexExists('qc_records', 'qc_records_property_id_index')) {
                $table->index('property_id', 'qc_records_property_id_index');
            }

            if (Schema::hasColumn('qc_records', 'unit_id') && !$this->indexExists('qc_records', 'qc_records_unit_id_index')) {
                $table->index('unit_id', 'qc_records_unit_id_index');
            }

            if (Schema::hasColumn('qc_records', 'room_id') && !$this->indexExists('qc_records', 'qc_records_room_id_index')) {
                $table->index('room_id', 'qc_records_room_id_index');
            }

            if (Schema::hasColumn('qc_records', 'visit_id') && !$this->indexExists('qc_records', 'qc_records_visit_id_index')) {
                $table->index('visit_id', 'qc_records_visit_id_index');
            }

            if (Schema::hasColumn('qc_records', 'legacy_pm_property_inspection_id') &&
                !$this->indexExists('qc_records', 'qc_records_legacy_pm_property_inspection_id_index')) {
                $table->index('legacy_pm_property_inspection_id', 'qc_records_legacy_pm_property_inspection_id_index');
            }
        });
    }

    public function down(): void
    {
        // Non-destructive rollback — indexes are additive.
    }

    private function indexExists(string $table, string $indexName): bool
    {
        try {
            $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
            return !empty($indexes);
        } catch (\Throwable) {
            return false;
        }
    }
};
