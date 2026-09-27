<?php

declare(strict_types=1);
$root=dirname(__DIR__,2);
$catalogue=(string)file_get_contents($root.'/System/Mcp/Support/McpCatalogue.php');
foreach ([
 'titan_config_search','titan_migrations_status','titan_queue_status','titan_scheduler_list','titan_permissions_summary','titan_audit_status','titan_backups_list'
] as $tool) if(!str_contains($catalogue, "'{$tool}'")) { fwrite(STDERR, "Missing operations tool {$tool}\n"); exit(1); }
foreach (['System/Mcp/Tools/OperationsTools.php','System/Mcp/Tools/RecoveryTools.php'] as $file) if(!is_file($root.'/'.$file)) { fwrite(STDERR, "Missing {$file}\n"); exit(1); }
$ops=(string)@file_get_contents($root.'/System/Mcp/Tools/OperationsTools.php');
foreach (['configSearch','migrationsStatus','queueStatus','schedulerList','permissionsSummary'] as $method) if(!str_contains($ops,'function '.$method.'(')) { fwrite(STDERR, "Missing OperationsTools::{$method}\n"); exit(1); }
$recovery=(string)@file_get_contents($root.'/System/Mcp/Tools/RecoveryTools.php');
foreach (['auditStatus','backupsList'] as $method) if(!str_contains($recovery,'function '.$method.'(')) { fwrite(STDERR, "Missing RecoveryTools::{$method}\n"); exit(1); }
echo "Titan MCP operations tool contract PASS\n";
