<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('work_jobs_events')) {
            return;
        }

        Schema::table('work_jobs_events', function (Blueprint $table) {
            if (!Schema::hasColumn('work_jobs_events','event_type')) {
                $table->string('event_type', 80)->default('updated');
            }
            if (!Schema::hasColumn('work_jobs_events','event_label')) {
                $table->string('event_label', 255)->nullable();
            }
            if (!Schema::hasColumn('work_jobs_events','severity')) {
                $table->string('severity', 20)->nullable();
            }
            if (!Schema::hasColumn('work_jobs_events','occurred_at')) {
                $table->dateTime('occurred_at')->nullable();
            }
            if (!Schema::hasColumn('work_jobs_events','meta_json')) {
                $table->json('meta_json')->nullable();
            }
            if (!Schema::hasColumn('work_jobs_events','team_id')) {
                $table->unsignedBigInteger('team_id')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('work_jobs_events','created_by_team_id')) {
                $table->unsignedBigInteger('created_by_team_id')->nullable()->after('team_id');
            }
        });

        // Backfill occurred_at from created_at where missing
        try { DB::statement("UPDATE work_jobs_events SET occurred_at = COALESCE(occurred_at, created_at)"); } catch (\Throwable $e) {}

        // Best-effort indexes (ignore errors if already exist)
        try { DB::statement("CREATE INDEX work_jobs_events_tenant_type_idx ON work_jobs_events (company_id, user_id, event_type)"); } catch (\Throwable $e) {}
        try { DB::statement("CREATE INDEX work_jobs_events_tenant_job_time_idx ON work_jobs_events (company_id, user_id, job_id, occurred_at)"); } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        // Non-destructive: no down actions.
    }
};
