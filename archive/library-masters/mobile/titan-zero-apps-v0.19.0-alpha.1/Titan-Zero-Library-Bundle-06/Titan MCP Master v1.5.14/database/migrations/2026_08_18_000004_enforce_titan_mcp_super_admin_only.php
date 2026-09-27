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

    private const UI = [
        'titan_mcp','titan_mcp_overview','titan_mcp_tools','titan_mcp_runtime',
        'titan_mcp_backups','titan_mcp_audit','titan_mcp_permissions','titan_mcp_settings',
    ];

    public function up(): void
    {
        if(!Schema::hasTable('permissions')||!Schema::hasTable('roles')||!Schema::hasTable('role_has_permissions')) return;

        $names=array_merge(self::MCP,self::UI);
        $permissionIds=DB::table('permissions')->where('guard_name','web')->whereIn('name',$names)->pluck('id')->map(static fn($id)=>(int)$id)->all();
        if($permissionIds===[]) return;

        $adminRoleId=DB::table('roles')->where('name','admin')->where('guard_name','web')->value('id');
        if(is_numeric($adminRoleId)){
            DB::table('role_has_permissions')->where('role_id',(int)$adminRoleId)->whereIn('permission_id',$permissionIds)->delete();
        }

        $superAdminRoleId=DB::table('roles')->where('name','super_admin')->where('guard_name','web')->value('id');
        if(is_numeric($superAdminRoleId)){
            foreach($permissionIds as $permissionId){
                DB::table('role_has_permissions')->updateOrInsert([
                    'permission_id'=>$permissionId,
                    'role_id'=>(int)$superAdminRoleId,
                ]);
            }
        }

        $this->forgetCache();
    }

    public function down(): void
    {
        if(!Schema::hasTable('permissions')||!Schema::hasTable('roles')||!Schema::hasTable('role_has_permissions')) return;

        $adminRoleId=DB::table('roles')->where('name','admin')->where('guard_name','web')->value('id');
        if(is_numeric($adminRoleId)){
            $legacyAdminUi=['titan_mcp','titan_mcp_overview','titan_mcp_tools','titan_mcp_runtime'];
            $permissionIds=DB::table('permissions')->where('guard_name','web')->whereIn('name',$legacyAdminUi)->pluck('id')->map(static fn($id)=>(int)$id)->all();
            foreach($permissionIds as $permissionId){
                DB::table('role_has_permissions')->updateOrInsert([
                    'permission_id'=>$permissionId,
                    'role_id'=>(int)$adminRoleId,
                ]);
            }
        }
        $this->forgetCache();
    }

    private function forgetCache(): void
    {
        if(class_exists(PermissionRegistrar::class)) app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
