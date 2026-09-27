<?php
declare(strict_types=1);
$root=dirname(__DIR__);
require $root.'/Services/RouteFreshnessPolicy.php';
use App\Extensions\TitanMapsIntelligence\Services\RouteFreshnessPolicy;
$p=new RouteFreshnessPolicy();
if($p->validForSeconds('live')!==900||$p->validForSeconds('typical')!==7200||$p->validForSeconds('static')!==86400){fwrite(STDERR,"validity policy failed\n");exit(1);} 
if(!$p->mustRefresh(strtotime('-3 hours'),strtotime('-2 hours'))){fwrite(STDERR,"stale refresh policy failed\n");exit(1);} 
if($p->mustRefresh(strtotime('-20 minutes'),strtotime('+1 hour'))){fwrite(STDERR,"fresh route marked stale\n");exit(1);} 
echo "beta1 route freshness runtime PASS\n";
