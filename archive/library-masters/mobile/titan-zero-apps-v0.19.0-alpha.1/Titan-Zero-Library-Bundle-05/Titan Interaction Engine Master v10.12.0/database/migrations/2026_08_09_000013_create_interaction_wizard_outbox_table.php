<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('interaction_wizard_outbox')) return;
        Schema::create('interaction_wizard_outbox', function (Blueprint $table): void {
            $table->string('id', 64);
            $table->string('company_id', 191);
            $table->string('status', 32)->default('pending');
            $table->longText('envelope');
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
            $table->primary(['company_id', 'id'], 'interaction_wizard_outbox_pk');
            $table->index(['company_id', 'status', 'created_at'], 'interaction_wizard_outbox_company_status_idx');
        });
    }

    public function down(): void
    {
        // Forward-only extension migration. Tenant data is retained by design.
    }
};
