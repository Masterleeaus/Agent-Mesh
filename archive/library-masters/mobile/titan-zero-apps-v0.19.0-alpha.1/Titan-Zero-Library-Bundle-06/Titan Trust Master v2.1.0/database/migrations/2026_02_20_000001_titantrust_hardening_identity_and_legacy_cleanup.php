<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'work_jobs_evidence_files',
            'work_jobs_evidence',
            'work_jobs_evidence_rules',
            'work_jobs_evidence_signoffs',
            'work_jobs_incidents',
            'work_jobs_attendance',
        ];

        foreach ($tables as $table) {
            if (!Schema::hasTable($table)) continue;

            Schema::table($table, function (Blueprint $t) use ($table) {
                if (!Schema::hasColumn($table, 'team_id')) {
                    $t->unsignedBigInteger('team_id')->nullable()->after('user_id');
                }
                if (!Schema::hasColumn($table, 'created_by_team_id')) {
                    $t->unsignedBigInteger('created_by_team_id')->nullable()->after('team_id');
                }
                if (!Schema::hasColumn($table, 'meta_json')) {
                    // Keep meta_json consistent with doctrine naming (even if older 'meta' existed)
                    $t->json('meta_json')->nullable();
                }
            });

            // Ensure composite tenant index
            $idx = $table . '_tenant_idx';
            try {
                Schema::table($table, function (Blueprint $t) use ($idx) {
                    $t->index(['company_id','user_id'], $idx);
                });
            } catch (Throwable $e) {
                // ignore if index already exists (MySQL duplicate)
            }
        }

        // Legacy cleanup: task_id -> job_item_id (idempotent)
        $map = [
            'work_jobs_evidence' => 'job_item_id',
            'work_jobs_incidents' => 'job_item_id',
        ];

        foreach ($map as $table => $newCol) {
            if (!Schema::hasTable($table)) continue;

            if (!Schema::hasColumn($table, $newCol)) {
                Schema::table($table, function (Blueprint $t) use ($table, $newCol) {
                    $t->unsignedBigInteger($newCol)->nullable()->after('job_id');
                });
            }

            if (Schema::hasColumn($table, 'task_id')) {
                // Backfill once
                DB::table($table)->whereNull($newCol)->update([$newCol => DB::raw('task_id')]);
                // Drop legacy column
                Schema::table($table, function (Blueprint $t) use ($table) {
                    $t->dropColumn('task_id');
                });
            }
        }

        // If old 'meta' JSON column exists, migrate it into meta_json and drop (optional)
        if (Schema::hasTable('work_jobs_evidence_files') && Schema::hasColumn('work_jobs_evidence_files','meta') && Schema::hasColumn('work_jobs_evidence_files','meta_json')) {
            DB::statement("UPDATE work_jobs_evidence_files SET meta_json = COALESCE(meta_json, meta)");
            Schema::table('work_jobs_evidence_files', function (Blueprint $t) {
                $t->dropColumn('meta');
            });
        }
    }

    public function down(): void
    {
        // Non-destructive rollback: do not drop identity columns (keeps data safe).
        // If needed, restore legacy task_id columns manually from job_item_id.
    }
};
