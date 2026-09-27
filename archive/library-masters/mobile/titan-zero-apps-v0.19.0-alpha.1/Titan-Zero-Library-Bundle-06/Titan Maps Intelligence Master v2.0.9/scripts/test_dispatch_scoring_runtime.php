<?php

declare(strict_types=1);

$root = dirname(__DIR__);
foreach (['DTO/DispatchScoreResult.php','Services/DispatchScoreService.php'] as $file) {
    if (!is_file($root.'/'.$file)) {
        fwrite(STDERR, "Missing {$file}\n");
        exit(1);
    }
    require_once $root.'/'.$file;
}

use App\Extensions\TitanMapsIntelligence\Services\DispatchScoreService;

$service = new DispatchScoreService();
$job = ['priority'=>'urgent','required_skills'=>['electrical'],'required_certifications'=>['electrical-licence']];

$best = $service->score($job, [
    'worker_public_id'=>'worker-a','eta_seconds'=>600,'skill_match'=>1.0,'skill_evidence'=>'explicit',
    'availability_status'=>'available','daily_workload'=>1,'territory_affinity'=>1.0,'continuity_count'=>3,
    'mandatory_certification_status'=>'verified',
]);
$lower = $service->score($job, [
    'worker_public_id'=>'worker-b','eta_seconds'=>1800,'skill_match'=>0.5,'skill_evidence'=>'experience',
    'availability_status'=>'available','daily_workload'=>5,'territory_affinity'=>0.0,'continuity_count'=>0,
    'mandatory_certification_status'=>'unknown',
]);
$blocked = $service->score($job, [
    'worker_public_id'=>'worker-c','eta_seconds'=>300,'skill_match'=>1.0,'skill_evidence'=>'explicit',
    'availability_status'=>'available','daily_workload'=>0,'territory_affinity'=>1.0,'continuity_count'=>5,
    'mandatory_certification_status'=>'failed',
]);

if ($best->blocked || !$lower->blocked || !in_array('mandatory_qualification_unverified',$lower->blockers,true)) { fwrite(STDERR, "Mandatory certification evidence gate failed\n"); exit(1); }
if ($best->totalScore <= $lower->totalScore) { fwrite(STDERR, "Expected worker-a to score above worker-b\n"); exit(1); }
if (!$blocked->blocked || !in_array('mandatory_qualification_failed',$blocked->blockers,true)) { fwrite(STDERR, "Mandatory certification failure did not block candidate\n"); exit(1); }
if (($lower->evidence['certification']['status'] ?? null) !== 'unknown') { fwrite(STDERR, "Unknown certification evidence was not preserved\n"); exit(1); }
if (array_sum($service->weights()) !== 100) { fwrite(STDERR, "Dispatch weights must total 100\n"); exit(1); }
if (!isset($best->dimensions['travel'],$best->dimensions['skill'],$best->dimensions['availability'],$best->dimensions['workload'],$best->dimensions['territory'],$best->dimensions['continuity'],$best->dimensions['urgency'])) { fwrite(STDERR, "Missing score dimension\n"); exit(1); }

echo "Dispatch scoring runtime: PASS\n";
