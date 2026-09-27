<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('maps_provider_connections')) return;
        Schema::table('maps_provider_connections', static function (Blueprint $table): void {
            if (!Schema::hasColumn('maps_provider_connections','secondary_credential_reference')) $table->string('secondary_credential_reference',255)->nullable();
            if (!Schema::hasColumn('maps_provider_connections','active_credential_slot')) $table->string('active_credential_slot',16)->default('primary');
            if (!Schema::hasColumn('maps_provider_connections','consecutive_auth_failures')) $table->unsignedSmallInteger('consecutive_auth_failures')->default(0);
            if (!Schema::hasColumn('maps_provider_connections','health_status')) $table->string('health_status',32)->default('unknown');
            if (!Schema::hasColumn('maps_provider_connections','last_error_code')) $table->string('last_error_code',96)->nullable();
            if (!Schema::hasColumn('maps_provider_connections','last_error_at')) $table->timestamp('last_error_at')->nullable();
        });
    }
    public function down(): void {}
};
