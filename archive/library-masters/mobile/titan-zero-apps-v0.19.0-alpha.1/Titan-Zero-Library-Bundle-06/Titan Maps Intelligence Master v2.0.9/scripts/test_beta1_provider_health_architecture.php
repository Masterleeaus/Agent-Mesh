<?php
$root=dirname(__DIR__);$checks=[
 ['Models/MapProviderConnection.php','secondary_credential_reference'],['Models/MapProviderConnection.php','active_credential_slot'],
 ['Services/ProviderHealthService.php','recordFailure'],['Services/ProviderHealthService.php','MAPS_PROVIDER_AUTH_FAILED'],
 ['Tools/ReadProviderHealthTool.php','ProviderHealthService'],['System/TitanMapsIntelligenceServiceProvider.php','credentialReference'],
 ['Providers/LaravelProviderHttpTransport.php','\'status\' => $response->status()'],
];$fail=[];foreach($checks as [$f,$n]){$s=@file_get_contents($root.'/'.$f)?:'';if(!str_contains($s,$n))$fail[]="$f missing $n";}if($fail){fwrite(STDERR,"FAIL\n - ".implode("\n - ",$fail)."\n");exit(1);}echo "PASS provider health/failover architecture\n";
