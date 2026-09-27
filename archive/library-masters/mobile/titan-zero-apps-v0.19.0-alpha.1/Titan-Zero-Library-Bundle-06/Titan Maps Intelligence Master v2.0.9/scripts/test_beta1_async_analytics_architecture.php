<?php
$root=dirname(__DIR__);$checks=[
 ['Jobs/RunTerritoryAnalyticsJob.php','ShouldQueue'],
 ['Jobs/RunTerritoryAnalyticsJob.php','FixedAuthorisedCompanyContext'],
 ['Services/FixedAuthorisedCompanyContext.php','AuthorisedCompanyContext'],
 ['Http/Controllers/TerritoryAnalyticsController.php','RunTerritoryAnalyticsJob::dispatch'],
 ['Http/Controllers/TerritoryAnalyticsController.php','snapshot_ttl'],
 ['Tools/RunTerritoryAnalyticsTool.php','RunTerritoryAnalyticsJob::dispatch'],
];$fail=[];foreach($checks as [$f,$n]){$s=@file_get_contents($root.'/'.$f)?:'';if(!str_contains($s,$n))$fail[]="$f missing $n";}if($fail){fwrite(STDERR,"FAIL\n - ".implode("\n - ",$fail)."\n");exit(1);}echo "PASS async analytics architecture\n";
