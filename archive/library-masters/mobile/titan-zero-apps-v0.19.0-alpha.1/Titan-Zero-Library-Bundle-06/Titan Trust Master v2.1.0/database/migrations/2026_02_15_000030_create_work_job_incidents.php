<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('work_jobs_incidents')) {
            Schema::create('work_jobs_incidents', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('user_id')->index();

                $table->unsignedBigInteger('job_id')->index();
                $table->unsignedBigInteger('task_id')->nullable()->index();

                $table->string('incident_type', 80)->nullable(); // damage|safety|access|complaint|other
                $table->string('severity', 30)->nullable(); // low|medium|high|critical
                $table->string('status', 30)->default('open'); // open|needs_review|resolved|void
                $table->string('title', 190);
                $table->text('description')->nullable();

                $table->unsignedBigInteger('reported_by_user_id')->nullable()->index();
                $table->timestamp('reported_at')->nullable();

                $table->timestamp('resolved_at')->nullable();
                $table->unsignedBigInteger('resolved_by_user_id')->nullable()->index();
                $table->text('resolution_notes')->nullable();

                $table->timestamps();

                $table->index(['company_id','user_id','job_id'], 'work_inc_tenant_job_idx');
            });
        }

        Schema::table('work_jobs_evidence', function (Blueprint $table) {
            if (!Schema::hasColumn('work_jobs_evidence', 'incident_id')) {
                $table->unsignedBigInteger('incident_id')->nullable()->after('task_id');
                $table->index(['incident_id'], 'work_ev_items_incident_idx');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('work_jobs_incidents')) {
            Schema::drop('work_jobs_incidents');
        }

        Schema::table('work_jobs_evidence', function (Blueprint $table) {
            if (Schema::hasColumn('work_jobs_evidence', 'incident_id')) {
                $table->dropColumn('incident_id');
            }
        });
    }
};
