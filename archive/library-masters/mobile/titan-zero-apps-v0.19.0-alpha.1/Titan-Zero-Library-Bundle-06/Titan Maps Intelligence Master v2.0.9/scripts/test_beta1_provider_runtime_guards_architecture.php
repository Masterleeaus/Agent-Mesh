<?php
$root=dirname(__DIR__);$checks=[
 ['Services/RoutingService.php',['ProviderHealthService','recordFailure','recordSuccess']],
 ['Services/GeocodingService.php',['ProviderQuotaGuard','ProviderHealthService','enforce']],
 ['Services/TrafficService.php',['ProviderQuotaGuard','ProviderHealthService','enforce']],
 ['Jobs/ProcessDiscoveryPage.php',['ProviderQuotaGuard','ProviderHealthService','enforceForCompany']],
];$fail=[];foreach($checks as [$f,$needles]){$s=file_get_contents($root.'/'.$f)?:'';foreach($needles as $n)if(!str_contains($s,$n))$fail[]="$f missing $n";}if($fail){fwrite(STDERR,"FAIL\n - ".implode("\n - ",$fail)."\n");exit(1);}echo "PASS provider runtime guard architecture\n";
