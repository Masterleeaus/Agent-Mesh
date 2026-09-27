<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('feedback_tickets')) {
            return;
        }
        Schema::table('feedback_tickets', function (Blueprint $table): void {
            if (!Schema::hasColumn('feedback_tickets', 'quality_control_id')) $table->unsignedBigInteger('quality_control_id')->nullable()->index();
            if (!Schema::hasColumn('feedback_tickets', 'quality_control_reason')) $table->string('quality_control_reason')->nullable();
            if (!Schema::hasColumn('feedback_tickets', 'job_id')) $table->unsignedBigInteger('job_id')->nullable()->index();
            if (!Schema::hasColumn('feedback_tickets', 'sla_due_at')) $table->timestamp('sla_due_at')->nullable()->index();
            if (!Schema::hasColumn('feedback_tickets', 'resolution_outcome')) $table->string('resolution_outcome')->nullable();
            if (!Schema::hasColumn('feedback_tickets', 'resolution_type')) $table->string('resolution_type')->nullable();
            if (!Schema::hasColumn('feedback_tickets', 'refund_amount')) $table->decimal('refund_amount', 12, 2)->nullable();
            if (!Schema::hasColumn('feedback_tickets', 'follow_up_schedule_id')) $table->unsignedBigInteger('follow_up_schedule_id')->nullable()->index();
            if (!Schema::hasColumn('feedback_tickets', 'complaint_source')) $table->string('complaint_source')->default('client');
            if (!Schema::hasColumn('feedback_tickets', 'requires_investigation')) $table->boolean('requires_investigation')->default(false);
            if (!Schema::hasColumn('feedback_tickets', 'resolved_by')) $table->unsignedBigInteger('resolved_by')->nullable();
            if (!Schema::hasColumn('feedback_tickets', 'escalated_at')) $table->timestamp('escalated_at')->nullable()->index();
            if (!Schema::hasColumn('feedback_tickets', 'escalation_reason')) $table->text('escalation_reason')->nullable();
            if (!Schema::hasColumn('feedback_tickets', 'corrective_work_item_id')) $table->string('corrective_work_item_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('feedback_tickets')) return;
        $columns = ['corrective_work_item_id','escalation_reason','escalated_at','resolved_by','requires_investigation','complaint_source','follow_up_schedule_id','refund_amount','resolution_type','resolution_outcome','sla_due_at','job_id','quality_control_reason','quality_control_id'];
        Schema::table('feedback_tickets', function (Blueprint $table) use ($columns): void {
            foreach ($columns as $column) {
                if (Schema::hasColumn('feedback_tickets', $column)) $table->dropColumn($column);
            }
        });
    }
};
