<?php
declare(strict_types=1);
$root=dirname(__DIR__);
require $root.'/DTO/ProviderQuotaDecision.php';
require $root.'/Services/ProviderQuotaPolicy.php';
use App\Extensions\TitanMapsIntelligence\Services\ProviderQuotaPolicy;
$p=new ProviderQuotaPolicy();
$ok=$p->decide(79, 100, 80, false);
if($ok->status!=='allowed'||!$ok->providerAllowed) {fwrite(STDERR,"allowed decision failed\n");exit(1);} 
$soft=$p->decide(80,100,80,false);
if($soft->status!=='soft_limited'||$soft->providerAllowed||!$soft->fallbackAllowed){fwrite(STDERR,"soft decision failed\n");exit(1);} 
$hard=$p->decide(100,100,80,false);
if($hard->status!=='hard_limited'||$hard->providerAllowed||$hard->fallbackAllowed){fwrite(STDERR,"hard decision failed\n");exit(1);} 
$override=$p->decide(100,100,80,true);
if($override->status!=='override'||!$override->providerAllowed){fwrite(STDERR,"override failed\n");exit(1);} 
echo "beta1 provider quota runtime PASS\n";
