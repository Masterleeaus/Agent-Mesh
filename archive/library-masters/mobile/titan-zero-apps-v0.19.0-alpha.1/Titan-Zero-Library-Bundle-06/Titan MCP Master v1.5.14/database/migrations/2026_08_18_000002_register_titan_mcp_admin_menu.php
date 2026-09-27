<?php

declare(strict_types=1);
use App\Extensions\TitanMcp\System\Mcp\Support\TitanMcpMenuSynchronizer;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up():void{app(TitanMcpMenuSynchronizer::class)->sync();}
    public function down():void{if(Schema::hasTable('menus'))DB::table('menus')->whereIn('key',TitanMcpMenuSynchronizer::keys())->delete();}
};
