<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('territory_analyses')) return;
        Schema::table('territory_analyses', static function (Blueprint $table): void {
            if (!Schema::hasColumn('territory_analyses','methodology_key')) $table->string('methodology_key',96)->nullable()->after('analysis_type');
            if (!Schema::hasColumn('territory_analyses','methodology_version')) $table->string('methodology_version',32)->nullable()->after('methodology_key');
            if (!Schema::hasColumn('territory_analyses','area_square_km')) $table->decimal('area_square_km',14,4)->nullable()->after('observation_period');
            if (!Schema::hasColumn('territory_analyses','input_summary')) $table->json('input_summary')->nullable()->after('area_square_km');
            if (!Schema::hasColumn('territory_analyses','findings')) $table->json('findings')->nullable()->after('generated_metrics');
        });
    }
    public function down(): void { /* forward-safe */ }
};
