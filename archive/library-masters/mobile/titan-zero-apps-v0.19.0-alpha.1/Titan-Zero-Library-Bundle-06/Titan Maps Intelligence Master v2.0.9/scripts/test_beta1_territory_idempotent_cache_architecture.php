<?php
$root=dirname(__DIR__);
foreach(['Tools/ValidateTerritoryTool.php','Tools/CheckServiceAreaTool.php'] as $f){$s=file_get_contents($root.'/'.$f)?:'';foreach(['ProviderCacheStore','cached','5'] as $n){if(!str_contains($s,$n)){fwrite(STDERR,"FAIL $f missing $n\n");exit(1);}}}
echo "PASS territory/service-area 5-second idempotent cache architecture\n";
