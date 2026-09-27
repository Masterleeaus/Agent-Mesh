<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('work_jobs_states')) {
            Schema::create('work_jobs_states', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->unsignedBigInteger('job_id');

                $table->string('state_type', 50); // REQUIRED
                $table->string('state_key', 80);  // REQUIRED
                $table->string('status', 50);     // REQUIRED

                $table->decimal('score', 6, 2)->nullable();
                $table->json('reasons_json')->nullable();
                $table->dateTime('checked_at')->nullable();
                $table->json('meta_json')->nullable();

                $table->timestamps();

                $table->unique(['company_id','user_id','job_id','state_key'], 'work_jobs_states_tenant_job_key_uniq');
                $table->index(['company_id','user_id','state_type','status'], 'work_jobs_states_tenant_type_status_idx');
            });
            return;
        }

        Schema::table('work_jobs_states', function (Blueprint $table) {
            foreach (['team_id','created_by_team_id'] as $col) {
                if (!Schema::hasColumn('work_jobs_states',$col)) $table->unsignedBigInteger($col)->nullable();
            }
            if (!Schema::hasColumn('work_jobs_states','state_type')) $table->string('state_type', 50)->default('workflow');
            if (!Schema::hasColumn('work_jobs_states','state_key')) $table->string('state_key', 80)->default('overall');
            if (!Schema::hasColumn('work_jobs_states','status')) $table->string('status', 50)->default('pending');
            if (!Schema::hasColumn('work_jobs_states','score')) $table->decimal('score', 6, 2)->nullable();
            if (!Schema::hasColumn('work_jobs_states','reasons_json')) $table->json('reasons_json')->nullable();
            if (!Schema::hasColumn('work_jobs_states','checked_at')) $table->dateTime('checked_at')->nullable();
            if (!Schema::hasColumn('work_jobs_states','meta_json')) $table->json('meta_json')->nullable();
        });

        // Best-effort indexes
        try { DB::statement("CREATE UNIQUE INDEX work_jobs_states_tenant_job_key_uniq ON work_jobs_states (company_id, user_id, job_id, state_key)"); } catch (\Throwable $e) {}
        try { DB::statement("CREATE INDEX work_jobs_states_tenant_type_status_idx ON work_jobs_states (company_id, user_id, state_type, status)"); } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        // Non-destructive.
    }
};
