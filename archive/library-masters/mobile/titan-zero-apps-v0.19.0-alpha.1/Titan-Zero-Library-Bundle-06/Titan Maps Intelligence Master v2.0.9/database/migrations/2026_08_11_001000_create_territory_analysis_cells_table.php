<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('territory_analysis_cells')) return;
        Schema::create('territory_analysis_cells', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('company_id',64);
            $table->uuid('territory_analysis_id');
            $table->string('cell_key',64);
            $table->decimal('center_latitude',10,7);
            $table->decimal('center_longitude',10,7);
            $table->decimal('north_boundary',10,7);
            $table->decimal('south_boundary',10,7);
            $table->decimal('east_boundary',10,7);
            $table->decimal('west_boundary',10,7);
            $table->decimal('area_square_km',14,6);
            $table->decimal('score',10,4)->nullable();
            $table->decimal('confidence',6,5)->nullable();
            $table->json('metrics')->nullable();
            $table->timestamps();
            $table->unique(['company_id','territory_analysis_id','cell_key'],'tac_company_analysis_cell_uq');
            $table->index(['company_id','territory_analysis_id'],'tac_company_analysis_idx');
            $table->foreign(['company_id','territory_analysis_id'],'tac_analysis_tenant_fk')->references(['company_id','id'])->on('territory_analyses');
        });
    }
    public function down(): void { /* forward-safe */ }
};
