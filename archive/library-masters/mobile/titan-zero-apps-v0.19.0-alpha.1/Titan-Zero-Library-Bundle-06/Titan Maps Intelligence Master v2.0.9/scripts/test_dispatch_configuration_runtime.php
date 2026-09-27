<?php

declare(strict_types=1);
$root=dirname(__DIR__);
require_once $root.'/Exceptions/MapsIntelligenceException.php';
require_once $root.'/Services/MapsConfiguration.php';
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
$config=require $root.'/config/titan_maps_intelligence.php';
$valid=new MapsConfiguration($config);
if($valid->dispatchCandidateLimit()!==20||$valid->dispatchRecommendationTtlSeconds()!==600||$valid->dispatchDailyCapacity()!==6||array_sum($valid->dispatchWeights())!==100){fwrite(STDERR,"Dispatch configuration accessors mismatch\n");exit(1);}
$bad=$config; $bad['dispatch_intelligence']['weights']['travel']=31;
try{new MapsConfiguration($bad);fwrite(STDERR,"Invalid dispatch weight sum was accepted\n");exit(1);}catch(MapsIntelligenceException $e){if($e->errorCode()!=='MAPS_CONFIGURATION_INVALID')throw $e;}
$bad=$config; $bad['dispatch_intelligence']['candidate_limit']=26;
try{new MapsConfiguration($bad);fwrite(STDERR,"Unsafe dispatch candidate limit was accepted\n");exit(1);}catch(MapsIntelligenceException $e){if($e->errorCode()!=='MAPS_CONFIGURATION_INVALID')throw $e;}
echo "Dispatch configuration runtime: PASS\n";
