<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('qc_status_catalog')) {
            return;
        }

        Schema::create('qc_status_catalog', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('company_id')->nullable()->index();
            $table->string('type', 50)->index();
            $table->string('key', 100)->index();
            $table->string('label', 191);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['company_id', 'type', 'key'], 'qc_status_catalog_company_type_key_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_status_catalog');
    }
};
