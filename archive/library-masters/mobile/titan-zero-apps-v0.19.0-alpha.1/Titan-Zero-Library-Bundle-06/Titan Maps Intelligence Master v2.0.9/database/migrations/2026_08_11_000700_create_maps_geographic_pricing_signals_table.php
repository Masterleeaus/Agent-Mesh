<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('maps_geographic_pricing_signals')) return;
        Schema::create('maps_geographic_pricing_signals', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64)->index('mgps_company_idx');
            $table->uuid('territory_evaluation_id');
            $table->uuid('service_territory_id')->nullable();
            $table->string('signal_type',64);
            $table->string('severity',24)->default('info');
            $table->boolean('authoritative')->default(false);
            $table->string('application_status',32)->default('not_applied');
            $table->string('hint_type',24)->nullable();
            $table->decimal('hint_value',12,4)->nullable();
            $table->string('currency',8)->nullable();
            $table->json('evidence')->nullable();
            $table->dateTime('emitted_at');
            $table->timestamps();
            $table->unique(['company_id','id'],'mgps_company_id_uq');
            $table->index(['company_id','territory_evaluation_id'],'mgps_eval_idx');
            $table->index(['company_id','signal_type','emitted_at'],'mgps_type_time_idx');
        });
    }
    public function down(): void { /* Forward-safe: pricing signal evidence is retained. */ }
};
