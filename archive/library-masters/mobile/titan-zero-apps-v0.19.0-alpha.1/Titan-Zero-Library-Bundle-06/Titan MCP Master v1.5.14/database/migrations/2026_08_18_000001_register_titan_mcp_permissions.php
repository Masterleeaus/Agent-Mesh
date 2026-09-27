<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const MCP = [
        'titan.mcp.admin','titan.mcp.access','titan.mcp.read','titan.mcp.repository.read','titan.mcp.database.read',
        'titan.mcp.runtime.read','titan.mcp.logs.read','titan.mcp.backups.read','titan.mcp.execute.read',
        'titan.mcp.repository.write','titan.mcp.repository.destructive','titan.mcp.database.write','titan.mcp.database.destructive',
        'titan.mcp.execute.write','titan.mcp.execute.destructive','titan.mcp.*',
    ];
    private const UI = ['titan_mcp','titan_mcp_overview','titan_mcp_tools','titan_mcp_runtime','titan_mcp_backups','titan_mcp_audit','titan_mcp_permissions','titan_mcp_settings'];

    public function up(): void
    {
        if(!Schema::hasTable('permissions')) return; $now=now();
        foreach(array_merge(self::MCP,self::UI) as $ability){DB::table('permissions')->updateOrInsert(['name'=>$ability,'guard_name'=>'web'],['updated_at'=>$now,'created_at'=>$now]);}
        if(Schema::hasTable('roles')&&Schema::hasTable('role_has_permissions')){
            $this->grant('admin',['titan_mcp','titan_mcp_overview','titan_mcp_tools','titan_mcp_runtime']);
            $this->grant('super_admin',array_merge(self::MCP,self::UI));
        }
        $this->forgetCache();
    }
    public function down(): void
    {
        if(!Schema::hasTable('permissions'))return;$names=array_merge(self::MCP,self::UI);
        $ids=DB::table('permissions')->where('guard_name','web')->whereIn('name',$names)->pluck('id')->map(static fn($id)=>(int)$id)->all();
        if($ids!==[]&&Schema::hasTable('role_has_permissions'))DB::table('role_has_permissions')->whereIn('permission_id',$ids)->delete();
        DB::table('permissions')->where('guard_name','web')->whereIn('name',$names)->delete();$this->forgetCache();
    }
    private function grant(string $roleName,array $abilities):void
    {
        $roleId=DB::table('roles')->where('name',$roleName)->where('guard_name','web')->value('id');if(!is_numeric($roleId))return;
        foreach($abilities as $ability){$permissionId=DB::table('permissions')->where('name',$ability)->where('guard_name','web')->value('id');if(is_numeric($permissionId))DB::table('role_has_permissions')->updateOrInsert(['permission_id'=>(int)$permissionId,'role_id'=>(int)$roleId]);}
    }
    private function forgetCache():void{if(class_exists(PermissionRegistrar::class))app(PermissionRegistrar::class)->forgetCachedPermissions();}
};
