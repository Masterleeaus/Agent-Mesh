<?php

declare(strict_types=1);
$root=dirname(__DIR__,2);
$source=(string)file_get_contents($root.'/System/Mcp/Support/OperationsInspector.php');
if(!str_contains($source,'$this->redactor->redact($value, $key)')){fwrite(STDERR,"Config search must redact with the full config key\n");exit(1);}
echo "Titan MCP operations redaction contract PASS\n";
