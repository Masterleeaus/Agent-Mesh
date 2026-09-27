<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('titan_builder_settings')) {
            return;
        }

        Schema::create('titan_builder_settings', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('company_id')->nullable()->index();
            $table->string('scope', 20)->index();
            $table->string('owner_key', 64)->index();
            $table->string('key', 120);
            $table->json('value')->nullable();
            $table->string('created_by', 120)->nullable();
            $table->timestamps();
            $table->unique(['owner_key', 'key'], 'titan_builder_settings_owner_key_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('titan_builder_settings');
    }
};
