<?php
use Illuminate\Database\Migrations\Migration;use Illuminate\Database\Schema\Blueprint;use Illuminate\Support\Facades\Schema;
return new class extends Migration {public function up():void {if(!Schema::hasTable('compliance_hashes'))return;Schema::table('compliance_hashes',function(Blueprint $t){if(!Schema::hasColumn('compliance_hashes','company_id')){$t->unsignedBigInteger('company_id')->nullable()->index();}});}public function down():void {}};
