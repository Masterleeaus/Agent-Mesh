<?php

declare(strict_types=1);
$root=dirname(__DIR__,2);
$required=['titan_mcp_runtime','titan_mcp_backups','titan_mcp_audit','titan_mcp_permissions'];
$base=(string)file_get_contents($root.'/database/migrations/2026_08_18_000001_register_titan_mcp_permissions.php');
foreach($required as $name) if(!str_contains($base,$name)){fwrite(STDERR,"Base permission migration missing {$name}\n");exit(1);}
$upgrade=$root.'/database/migrations/2026_08_18_000003_register_titan_mcp_operations_permissions.php';
if(!is_file($upgrade)){fwrite(STDERR,"Missing upgrade permission migration\n");exit(1);}
$source=(string)file_get_contents($upgrade);
foreach($required as $name) if(!str_contains($source,$name)){fwrite(STDERR,"Upgrade permission migration missing {$name}\n");exit(1);}
echo "Titan MCP expanded permissions contract PASS\n";
