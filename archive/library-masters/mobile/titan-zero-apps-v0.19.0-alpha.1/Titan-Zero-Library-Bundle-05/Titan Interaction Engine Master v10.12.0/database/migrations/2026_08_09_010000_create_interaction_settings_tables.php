<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('interaction_platform_settings')) {
            Schema::create('interaction_platform_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('key', 120)->unique();
                $table->json('value')->nullable();
                $table->string('updated_by', 191)->nullable();
                $table->timestamp('updated_at')->useCurrent();
            });
        }
        if (!Schema::hasTable('interaction_company_settings')) {
            Schema::create('interaction_company_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('company_id', 191)->index();
                $table->string('key', 120);
                $table->json('value')->nullable();
                $table->string('updated_by', 191)->nullable();
                $table->timestamp('updated_at')->useCurrent();
                $table->unique(['company_id', 'key'], 'interaction_company_settings_company_key_uq');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('interaction_company_settings');
        Schema::dropIfExists('interaction_platform_settings');
    }
};
