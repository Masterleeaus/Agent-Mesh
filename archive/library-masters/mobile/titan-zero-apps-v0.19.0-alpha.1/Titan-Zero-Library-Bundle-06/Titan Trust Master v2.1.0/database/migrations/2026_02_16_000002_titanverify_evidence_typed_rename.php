<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // work_jobs_evidence_files: meta -> meta_json
        if (Schema::hasTable('work_jobs_evidence_files')) {
            Schema::table('work_jobs_evidence_files', function (Blueprint $table) {
                if (!Schema::hasColumn('work_jobs_evidence_files', 'meta_json')) {
                    $table->json('meta_json')->nullable();
                }
            });

            try {
                if (Schema::hasColumn('work_jobs_evidence_files', 'meta') && Schema::hasColumn('work_jobs_evidence_files', 'meta_json')) {
                    DB::statement("UPDATE work_jobs_evidence_files SET meta_json = COALESCE(meta_json, meta)");
                }
            } catch (\Throwable $e) {}

            // Best-effort drop legacy column (ignored if not supported)
            try { if (Schema::hasColumn('work_jobs_evidence_files','meta')) DB::statement("ALTER TABLE work_jobs_evidence_files DROP COLUMN meta"); } catch (\Throwable $e) {}
        }

        // work_jobs_evidence: type -> evidence_type, meta -> meta_json
        if (Schema::hasTable('work_jobs_evidence')) {
            Schema::table('work_jobs_evidence', function (Blueprint $table) {
                if (!Schema::hasColumn('work_jobs_evidence', 'evidence_type')) {
                    $table->string('evidence_type', 50)->nullable();
                }
                if (!Schema::hasColumn('work_jobs_evidence', 'meta_json')) {
                    $table->json('meta_json')->nullable();
                }
            });

            try {
                if (Schema::hasColumn('work_jobs_evidence','type') && Schema::hasColumn('work_jobs_evidence','evidence_type')) {
                    DB::statement("UPDATE work_jobs_evidence SET evidence_type = COALESCE(evidence_type, type)");
                }
            } catch (\Throwable $e) {}

            // Enforce not-null where possible (best-effort)
            try {
                DB::statement("UPDATE work_jobs_evidence SET evidence_type = COALESCE(evidence_type, 'general')");
                DB::statement("ALTER TABLE work_jobs_evidence MODIFY evidence_type VARCHAR(50) NOT NULL");
            } catch (\Throwable $e) {}

            // Best-effort drop legacy columns (ignored if not supported)
            try { if (Schema::hasColumn('work_jobs_evidence','type')) DB::statement("ALTER TABLE work_jobs_evidence DROP COLUMN type"); } catch (\Throwable $e) {}
            try { if (Schema::hasColumn('work_jobs_evidence','meta')) DB::statement("ALTER TABLE work_jobs_evidence DROP COLUMN meta"); } catch (\Throwable $e) {}

            // Index
            try { DB::statement("CREATE INDEX work_jobs_evidence_tenant_job_type_idx ON work_jobs_evidence (company_id, user_id, job_id, evidence_type)"); } catch (\Throwable $e) {}
        }
    }

    public function down(): void
    {
        // Non-destructive
    }
};
