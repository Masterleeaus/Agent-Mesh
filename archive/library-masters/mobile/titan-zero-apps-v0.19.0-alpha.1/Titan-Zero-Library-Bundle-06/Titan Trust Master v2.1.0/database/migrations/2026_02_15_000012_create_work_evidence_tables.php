<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('work_jobs_evidence_files')) {
            Schema::create('work_jobs_evidence_files', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->string('disk')->nullable();
                $table->string('path')->nullable();
                $table->string('original_name')->nullable();
                $table->string('mime')->nullable();
                $table->unsignedBigInteger('size')->default(0);
                $table->string('sha256', 64)->nullable();
                $table->json('meta_json')->nullable();

                $table->timestamps();

                $table->index(['company_id','user_id'], 'work_ev_files_tenant_idx');
                $table->index(['sha256'], 'work_ev_files_sha_idx');
            });
        }

        if (!Schema::hasTable('work_jobs_evidence')) {
            Schema::create('work_jobs_evidence', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->unsignedBigInteger('job_id')->nullable();
                $table->unsignedBigInteger('task_id')->nullable();
                $table->unsignedBigInteger('site_id')->nullable();

                $table->string('type')->nullable(); // before|after|incident|signoff|general
                $table->text('caption')->nullable();

                $table->unsignedBigInteger('file_id')->nullable();
                $table->unsignedBigInteger('captured_by_user_id')->nullable();
                $table->timestamp('captured_at')->nullable();

                $table->timestamps();

                $table->index(['company_id','user_id'], 'work_ev_items_tenant_idx');
                $table->index(['job_id'], 'work_ev_items_job_idx');
                $table->index(['task_id'], 'work_ev_items_task_idx');
                $table->index(['type'], 'work_ev_items_type_idx');

                $table->foreign('file_id')->references('id')->on('work_jobs_evidence_files')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('work_jobs_evidence_rules')) {
            Schema::create('work_jobs_evidence_rules', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->unsignedBigInteger('template_id')->nullable();
                $table->string('job_type')->nullable();
                $table->string('site_type')->nullable();

                $table->json('required')->nullable();

                $table->timestamps();

                $table->index(['company_id','user_id'], 'work_ev_rules_tenant_idx');
                $table->index(['template_id'], 'work_ev_rules_template_idx');
            });
        }

        if (!Schema::hasTable('work_jobs_evidence_signoffs')) {
            Schema::create('work_jobs_evidence_signoffs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->unsignedBigInteger('job_id')->nullable();
                $table->string('client_name')->nullable();
                $table->timestamp('signed_at')->nullable();
                $table->unsignedBigInteger('signature_file_id')->nullable();
                $table->text('notes')->nullable();

                $table->timestamps();

                $table->index(['company_id','user_id'], 'work_ev_signoffs_tenant_idx');
                $table->index(['job_id'], 'work_ev_signoffs_job_idx');
                $table->foreign('signature_file_id')->references('id')->on('work_jobs_evidence_files')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('work_jobs_evidence_logs')) {
            Schema::create('work_jobs_evidence_logs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->unsignedBigInteger('evidence_item_id')->nullable();
                $table->string('level')->nullable();
                $table->string('status')->nullable();
                $table->longText('message')->nullable();
                $table->json('meta_json')->nullable();

                $table->timestamps();

                $table->index(['company_id','user_id'], 'work_ev_logs_tenant_idx');
                $table->index(['evidence_item_id'], 'work_ev_logs_item_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('work_jobs_evidence_logs');
        Schema::dropIfExists('work_jobs_evidence_signoffs');
        Schema::dropIfExists('work_jobs_evidence_rules');
        Schema::dropIfExists('work_jobs_evidence');
        Schema::dropIfExists('work_jobs_evidence_files');
    }
};
