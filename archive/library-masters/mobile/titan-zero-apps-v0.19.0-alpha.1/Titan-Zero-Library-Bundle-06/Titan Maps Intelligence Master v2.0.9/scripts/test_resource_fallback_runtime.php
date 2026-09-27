<?php

declare(strict_types=1);

$root=dirname(__DIR__);
foreach(['DTO/ResourceFallbackScoreResult.php','Services/ResourceFallbackScoreService.php','Services/ResourceFallbackStagePolicy.php'] as $file){
    if(!is_file($root.'/'.$file)){fwrite(STDERR,"Missing {$file}\n");exit(1);} require_once $root.'/'.$file;
}

use App\Extensions\TitanMapsIntelligence\Services\ResourceFallbackScoreService;
use App\Extensions\TitanMapsIntelligence\Services\ResourceFallbackStagePolicy;

$score=new ResourceFallbackScoreService();
$provider=$score->score([
    'source'=>'approved_network','service_match'=>1.0,'service_evidence'=>'explicit','duration_seconds'=>900,'distance_metres'=>12000,
    'eta_basis'=>'provider_eta','data_completeness'=>1.0,'rating'=>4.7,'review_count'=>90,
]);
$estimate=$score->score([
    'source'=>'discovery','service_match'=>0.5,'service_evidence'=>'unknown','duration_seconds'=>null,'distance_metres'=>null,
    'straight_line_distance_metres'=>3000,'eta_basis'=>'unavailable','data_completeness'=>0.8,'rating'=>4.9,'review_count'=>800,
]);
if($provider->totalScore <= $estimate->totalScore){fwrite(STDERR,"Provider-evidence candidate should outrank unknown-fit straight-line estimate\n");exit(1);} 
if(($estimate->evidence['service']['status']??null)!=='unknown'){fwrite(STDERR,"Unknown service evidence was not preserved\n");exit(1);} 
if(($estimate->evidence['travel']['eta_basis']??null)!=='unavailable'){fwrite(STDERR,"Missing ETA was not preserved as unavailable\n");exit(1);} 
if(!array_key_exists('road_distance_metres',$estimate->dimensions['travel']) || $estimate->dimensions['travel']['road_distance_metres']!==null){fwrite(STDERR,"Straight-line fallback was incorrectly labelled as road distance\n");exit(1);} 

$policy=new ResourceFallbackStagePolicy();
if($policy->nextStage(true,5)!=='internal_available'){fwrite(STDERR,"Internal availability must stop external escalation\n");exit(1);} 
if($policy->nextStage(false,3)!=='approved_network_review'){fwrite(STDERR,"Approved network must precede discovery\n");exit(1);} 
if($policy->nextStage(false,0)!=='discovery_searching'){fwrite(STDERR,"Discovery should start only after approved network is empty\n");exit(1);} 

echo "Resource fallback runtime: PASS\n";
