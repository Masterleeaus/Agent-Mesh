<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class TitanMcpMenuSynchronizer
{
    public const KEY='titan_mcp';
    private const CHILDREN=[
        'titan_mcp_overview'=>['route'=>'dashboard.admin.titan-mcp.overview','label'=>'Overview','order'=>1,'icon'=>'tabler-dashboard'],
        'titan_mcp_tools'=>['route'=>'dashboard.admin.titan-mcp.tools','label'=>'Tool Catalogue','order'=>2,'icon'=>'tabler-tools'],
        'titan_mcp_runtime'=>['route'=>'dashboard.admin.titan-mcp.runtime','label'=>'Runtime Health','order'=>3,'icon'=>'tabler-heart-rate-monitor'],
        'titan_mcp_backups'=>['route'=>'dashboard.admin.titan-mcp.backups','label'=>'Backups and Recovery','order'=>4,'icon'=>'tabler-database-export'],
        'titan_mcp_audit'=>['route'=>'dashboard.admin.titan-mcp.audit','label'=>'Audit Ledger','order'=>5,'icon'=>'tabler-shield-check'],
        'titan_mcp_permissions'=>['route'=>'dashboard.admin.titan-mcp.permissions','label'=>'Access and Permissions','order'=>6,'icon'=>'tabler-lock-access'],
        'titan_mcp_settings'=>['route'=>'dashboard.admin.titan-mcp.settings','label'=>'Settings','order'=>7,'icon'=>'tabler-settings'],
    ];

    public function sync(): void
    {
        try {
            if(!Schema::hasTable('menus')||!Schema::hasColumn('menus','key')) return;
            // Website1408 / Installer 1.7.8 stores both user and Super Admin navigation
            // in the shared `menus` table. Its native discriminator is the admin route
            // namespace plus the 900+ administration order band. Newer hosts may also
            // expose an explicit `is_admin` column; use it when available without making
            // it a prerequisite for valid Super Admin navigation.
            $hasAdminDiscriminator=Schema::hasColumn('menus','is_admin');
            $columns=array_flip(Schema::getColumnListing('menus'));
            $changed=false;
            $parentId=$this->syncRow(self::KEY,[
                'parent_id'=>null,'route'=>'dashboard.admin.titan-mcp.overview','route_slug'=>null,'label'=>'Titan MCP','icon'=>'tabler-plug-connected','svg'=>null,'order'=>996,'is_active'=>1,'is_admin'=>$hasAdminDiscriminator?1:null,'params'=>'[]','type'=>'item','badge'=>null,'extension'=>'1','bolt_menu'=>0,'bolt_background'=>null,'bolt_foreground'=>null,'letter_icon'=>0,'letter_icon_bg'=>null,'custom_menu'=>0,
            ],$columns,$changed);
            if($parentId===null) $parentId=app(\Illuminate\Database\DatabaseManager::class)->table('menus')->where('key',self::KEY)->value('id');
            foreach(self::CHILDREN as $key=>$item){
                $this->syncRow($key,[
                    'parent_id'=>$parentId,'route'=>$item['route'],'route_slug'=>null,'label'=>$item['label'],'icon'=>$item['icon'],'svg'=>null,'order'=>$item['order'],'is_active'=>1,'is_admin'=>$hasAdminDiscriminator?1:null,'params'=>'[]','type'=>'item','badge'=>null,'extension'=>'1','bolt_menu'=>0,'bolt_background'=>null,'bolt_foreground'=>null,'letter_icon'=>0,'letter_icon_bg'=>null,'custom_menu'=>0,
                ],$columns,$changed);
            }
            if($changed) $this->refreshMenuCache();
        } catch(\Throwable){ /* navigation must not break boot */ }
    }

    /** @param array<string,mixed> $desired @param array<string,int> $columns */
    private function syncRow(string $key,array $desired,array $columns,bool &$changed): int|string|null
    {
        $query=app(\Illuminate\Database\DatabaseManager::class)->table('menus')->where('key',$key); $existing=$query->first();
        $desired=array_intersect_key($desired,$columns);
        // Preserve the administrator's enabled state. Preserve child ordering, but force
        // the Titan MCP root into the Super Admin order band so legacy order=98 rows
        // cannot leak back into ordinary user navigation during upgrades.
        if($existing!==null){
            foreach(['is_active'] as $preserve){ if(array_key_exists($preserve,$desired)&&property_exists($existing,$preserve)) $desired[$preserve]=$existing->{$preserve}; }
            if($key!==self::KEY && array_key_exists('order',$desired) && property_exists($existing,'order')) $desired['order']=$existing->order;
        }
        $needs=$existing===null;
        if($existing!==null){foreach($desired as $field=>$value){if((string)($existing->{$field}??'')!==(string)($value??'')){$needs=true;break;}}}
        if(!$needs) return $existing->id??null;
        $changed=true; $row=$desired; if(isset($columns['updated_at']))$row['updated_at']=now();
        if($existing!==null){$query->update($row);return $existing->id??null;}
        $insert=['key'=>$key]+$row; if(isset($columns['created_at']))$insert['created_at']=now();
        return app(\Illuminate\Database\DatabaseManager::class)->table('menus')->insertGetId(array_intersect_key($insert,$columns));
    }

    public static function keys(): array { return array_merge([self::KEY],array_keys(self::CHILDREN)); }

    private function refreshMenuCache(): void
    {
        $class=\App\Services\Common\MenuService::class; if(!class_exists($class))return;
        try{$service=app($class);if(method_exists($service,'regenerate'))$service->regenerate();}catch(\Throwable){}
    }
}
