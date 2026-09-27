<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('qc_corrective_action_updates')) {
            return;
        }

        Schema::create('qc_corrective_action_updates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('company_id')->nullable()->index();
            $table->unsignedBigInteger('corrective_action_id')->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->string('status', 30)->nullable()->index();
            $table->text('note')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('corrective_action_id', 'fk_qc_corrective_updates_action_id')
                ->references('id')
                ->on('qc_corrective_actions')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_corrective_action_updates');
    }
};
