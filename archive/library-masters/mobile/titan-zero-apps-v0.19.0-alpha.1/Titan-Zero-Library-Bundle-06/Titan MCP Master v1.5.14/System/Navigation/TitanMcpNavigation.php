<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Navigation;

final class TitanMcpNavigation
{
    /** @return array<int,array<string,mixed>> */
    public function admin(): array
    {
        return [[
            'key'=>'titan_mcp', 'label'=>'Titan MCP', 'icon'=>'tabler-plug-connected', 'route'=>'dashboard.admin.titan-mcp.overview', 'permission'=>'titan_mcp', 'order'=>996,
            'children'=>[
                ['key'=>'titan_mcp_overview','label'=>'Overview','route'=>'dashboard.admin.titan-mcp.overview','permission'=>'titan_mcp_overview','order'=>1],
                ['key'=>'titan_mcp_tools','label'=>'Tool Catalogue','route'=>'dashboard.admin.titan-mcp.tools','permission'=>'titan_mcp_tools','order'=>2],
                ['key'=>'titan_mcp_runtime','label'=>'Runtime Health','route'=>'dashboard.admin.titan-mcp.runtime','permission'=>'titan_mcp_runtime','order'=>3],
                ['key'=>'titan_mcp_backups','label'=>'Backups and Recovery','route'=>'dashboard.admin.titan-mcp.backups','permission'=>'titan_mcp_backups','order'=>4],
                ['key'=>'titan_mcp_audit','label'=>'Audit Ledger','route'=>'dashboard.admin.titan-mcp.audit','permission'=>'titan_mcp_audit','order'=>5],
                ['key'=>'titan_mcp_permissions','label'=>'Access and Permissions','route'=>'dashboard.admin.titan-mcp.permissions','permission'=>'titan_mcp_permissions','order'=>6],
                ['key'=>'titan_mcp_settings','label'=>'Settings','route'=>'dashboard.admin.titan-mcp.settings','permission'=>'titan_mcp_settings','order'=>7],
            ],
        ]];
    }
}
