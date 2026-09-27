<?php

declare(strict_types=1);
$root=dirname(__DIR__,2);
$origin=file_get_contents($root.'/System/Mcp/Support/TrustedOriginPolicy.php')?:'';
$settings=file_get_contents($root.'/System/Http/Controllers/TitanMcpSettingsController.php')?:'';
$cors=file_get_contents($root.'/System/Http/Middleware/TitanMcpCors.php')?:'';
$transport=file_get_contents($root.'/System/Http/Transport/McpTransportController.php')?:'';
$invoker=file_get_contents($root.'/System/Http/Transport/McpToolInvoker.php')?:'';
if(!str_contains($origin,'chrome-extension')){fwrite(STDERR,"Chrome extension origins not supported\n");exit(1);}
if(!str_contains($settings,'chrome-extension')){fwrite(STDERR,"Settings cannot validate Chrome extension origins\n");exit(1);}
if(!str_contains($cors,'Authorization')){fwrite(STDERR,"Bearer auth header missing from CORS\n");exit(1);}
if(!str_contains($transport,"'isError'=>true")&&!str_contains($transport,"'isError' => true")){fwrite(STDERR,"Structured MCP tool errors missing\n");exit(1);}
if(!str_contains($invoker,'expectedOccurrences')||!str_contains($invoker,"'description'")){fwrite(STDERR,"Agent-oriented schemas incomplete\n");exit(1);}
echo "Titan MCP client compatibility contract: PASS\n";
