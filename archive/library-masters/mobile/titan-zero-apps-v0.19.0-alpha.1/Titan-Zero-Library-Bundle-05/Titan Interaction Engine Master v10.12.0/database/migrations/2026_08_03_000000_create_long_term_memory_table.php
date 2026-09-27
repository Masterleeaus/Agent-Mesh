<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('local_intelligence_memories')) {
            return;
        }

        Schema::create('local_intelligence_memories', function (Blueprint $table): void {
            $table->id();
            $table->string('company_id')->index();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('device_id')->nullable()->index();
            $table->string('memory_type', 40)->index();
            $table->string('memory_key', 190);
            $table->json('value');
            $table->decimal('confidence', 6, 5)->default(0.5);
            $table->unsignedInteger('frequency')->default(1);
            $table->timestamp('last_observed_at')->nullable()->index();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['company_id', 'user_id', 'device_id', 'memory_type', 'memory_key'], 'local_memory_scope_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('local_intelligence_memories');
    }
};
