<?php
declare(strict_types=1);
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration { public function up():void { if(Schema::hasTable('maps_dispatch_scoring_policies'))return; Schema::create('maps_dispatch_scoring_policies',static function(Blueprint $table):void{
$table->uuid('id')->primary();$table->string('company_id',64);$table->string('vertical',96)->nullable();$table->string('policy_version',64)->default('tenant-v1');$table->json('weights');$table->json('temporal_settings')->nullable();$table->boolean('enabled')->default(true);$table->string('updated_by_user_id',64)->nullable();$table->json('metadata')->nullable();$table->timestamps();$table->unique(['company_id','vertical'],'mdsp_company_vertical_uq');$table->index(['company_id','enabled'],'mdsp_company_enabled_idx'); }); } public function down():void{} };
