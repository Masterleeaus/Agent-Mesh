<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\DTO\DispatchScoreResult;

final class DispatchScoreService
{
    private const DEFAULT_WEIGHTS = [
        'travel'=>30,'skill'=>25,'availability'=>15,'workload'=>10,'territory'=>8,'continuity'=>7,'urgency'=>5,
    ];

    /** @param array<string,int|float> $weights */
    public function __construct(private readonly array $configuredWeights = []) {}

    /** @return array<string,int|float> */
    public function weights(): array
    {
        return $this->configuredWeights === [] ? self::DEFAULT_WEIGHTS : $this->configuredWeights;
    }

    /** @param array<string,mixed> $job @param array<string,mixed> $candidate */
    public function score(array $job, array $candidate, ?array $weightsOverride = null): DispatchScoreResult
    {
        $weights = $weightsOverride ?? $this->weights();
        $weights = $this->validatedWeights($weights);
        $temporal = $this->temporalFactors($candidate);
        $blockers = [];
        if (($candidate['availability_status'] ?? 'unknown') === 'conflict') $blockers[] = 'schedule_conflict';
        $certificationStatus = (string) ($candidate['mandatory_certification_status'] ?? 'unknown');
        $requiredCertifications = array_values(array_filter((array) ($job['required_certifications'] ?? [])));
        if ($certificationStatus === 'failed') $blockers[] = 'mandatory_qualification_failed';
        if ($requiredCertifications !== [] && $certificationStatus === 'unknown') $blockers[] = 'mandatory_qualification_unverified';
        if (($candidate['tracking_allowed'] ?? true) !== true) $blockers[] = 'tracking_not_allowed';
        if (($candidate['on_duty'] ?? true) !== true) $blockers[] = 'worker_off_duty';
        if (($candidate['location_status'] ?? 'fresh') === 'unavailable') $blockers[] = 'worker_location_unavailable';

        $eta = isset($candidate['eta_seconds']) && is_numeric($candidate['eta_seconds']) ? (int)$candidate['eta_seconds'] : null;
        $distance = isset($candidate['distance_metres']) && is_numeric($candidate['distance_metres']) ? (int)$candidate['distance_metres'] : null;
        $straight = isset($candidate['straight_line_distance_metres']) && is_numeric($candidate['straight_line_distance_metres']) ? (int)$candidate['straight_line_distance_metres'] : null;
        $travelRatio = $eta !== null ? $this->inverseRange($eta, 900, 5400) : ($distance !== null || $straight !== null ? $this->inverseRange((int)($distance ?? $straight), 5000, 50000) : 0.0);

        $skillRatio = $this->clamp((float)($candidate['skill_match'] ?? 0.5));
        $availability = (match ((string)($candidate['availability_status'] ?? 'unknown')) {
            'available' => 1.0,
            'conflict' => 0.0,
            default => 0.5,
        }) * $temporal['availability_delay'];
        $workload = max(0, (int)($candidate['daily_workload'] ?? 0));
        $capacity = max(1, (int)($candidate['daily_capacity'] ?? 6));
        $workloadRatio = $this->clamp((1.0 - ($workload / $capacity)) * $temporal['fatigue']);
        $territoryRatio = $this->clamp((float)($candidate['territory_affinity'] ?? 0.5));
        $continuityRatio = $this->clamp(max(((int)($candidate['continuity_count'] ?? 0)) / 3.0, (float)$temporal['familiarity']));
        $urgencyRatio = $this->urgencyRatio((string)($job['priority'] ?? 'normal'), $eta);

        $ratios = [
            'travel'=>$travelRatio,'skill'=>$skillRatio,'availability'=>$availability,'workload'=>$workloadRatio,
            'territory'=>$territoryRatio,'continuity'=>$continuityRatio,'urgency'=>$urgencyRatio,
        ];
        $dimensions = [];
        foreach ($ratios as $key=>$ratio) $dimensions[$key] = round(((float)$weights[$key]) * $ratio, 2);
        $score = round(array_sum($dimensions), 2);

        $certStatus = (string)($candidate['mandatory_certification_status'] ?? 'unknown');
        $evidence = [
            'travel'=>['status'=>$eta !== null ? 'provider_or_cache_eta' : (($distance !== null || $straight !== null) ? 'distance_only' : 'unavailable'),'eta_seconds'=>$eta,'distance_metres'=>$distance,'straight_line_distance_metres'=>$straight],
            'skill'=>['status'=>(string)($candidate['skill_evidence'] ?? 'unknown'),'match'=>$skillRatio],
            'certification'=>['status'=>$certStatus],
            'availability'=>['status'=>(string)($candidate['availability_status'] ?? 'unknown'),'time_until_available_seconds'=>(int)($candidate['time_until_available_seconds']??0)],
            'workload'=>['active_count'=>$workload,'capacity'=>$capacity,'consecutive_jobs'=>(int)($candidate['consecutive_jobs']??0),'fatigue_factor'=>$temporal['fatigue'],'shift_end_factor'=>$temporal['shift_end']],
            'territory'=>['affinity'=>$territoryRatio],
            'continuity'=>['prior_jobs'=>(int)($candidate['continuity_count'] ?? 0),'customer_familiarity_score'=>(int)($candidate['customer_familiarity_score']??0)],
            'urgency'=>['priority'=>(string)($job['priority'] ?? 'normal'),'eta_seconds'=>$eta],
        ];
        $explanations = $this->explanations($dimensions, $evidence, $blockers);
        return new DispatchScoreResult($score, $blockers !== [], $dimensions, $evidence, $blockers, $explanations);
    }


    /** @param array<string,int|float> $weights @return array<string,int|float> */
    private function validatedWeights(array $weights): array
    {
        $expected=['travel','skill','availability','workload','territory','continuity','urgency'];
        $actual=array_keys($weights); sort($actual); $sorted=$expected; sort($sorted);
        if($actual!==$sorted) throw new \InvalidArgumentException('Dispatch scoring weights must contain exactly the supported signal keys.');
        $sum=0.0; foreach($weights as $key=>$value){ if(!is_numeric($value)||(float)$value<0||(float)$value>100) throw new \InvalidArgumentException('Invalid dispatch scoring weight: '.$key); $sum+=(float)$value; }
        if(abs($sum-100.0)>0.000001) throw new \InvalidArgumentException('Dispatch scoring weights must sum to exactly 100.');
        return $weights;
    }

    /** @param array<string,mixed> $input @return array<string,float> */
    private function temporalFactors(array $input): array
    {
        $shift=max(0,(int)($input['shift_end_seconds']??PHP_INT_MAX));
        $jobs=max(0,(int)($input['consecutive_jobs']??0));
        $familiarity=(float)(max(0,min(100,(int)($input['customer_familiarity_score']??0)))/100);
        $wait=max(0,(int)($input['time_until_available_seconds']??0));
        return [
            'shift_end'=>$shift===PHP_INT_MAX?1.0:max(0.0,min(1.0,$shift/7200)),
            'fatigue'=>max(0.2,1.0-min(0.8,$jobs*0.1)),
            'familiarity'=>$familiarity,
            'availability_delay'=>max(0.0,1.0-min(1.0,$wait/7200)),
        ];
    }

    private function urgencyRatio(string $priority, ?int $eta): float
    {
        if ($eta === null) return 0.25;
        $target = match (strtolower($priority)) { 'emergency','urgent'=>1200, 'high'=>1800, 'low'=>5400, default=>3600 };
        if ($eta <= $target) return 1.0;
        return $this->clamp(1.0 - (($eta - $target) / max(1, $target * 2)));
    }

    private function inverseRange(int $value, int $best, int $worst): float
    {
        if ($value <= $best) return 1.0;
        if ($value >= $worst) return 0.0;
        return $this->clamp(1.0 - (($value - $best) / ($worst - $best)));
    }

    private function clamp(float $value): float { return max(0.0, min(1.0, $value)); }

    /** @param array<string,float> $dimensions @param array<string,mixed> $evidence @param array<int,string> $blockers @return array<int,string> */
    private function explanations(array $dimensions, array $evidence, array $blockers): array
    {
        $messages = [];
        if ($blockers !== []) $messages[] = 'Blocked: '.implode(', ', array_map(static fn(string $v): string => str_replace('_',' ',$v), $blockers)).'.';
        $sorted = $dimensions; arsort($sorted);
        foreach (array_slice($sorted,0,3,true) as $key=>$points) $messages[] = ucfirst($key).' contributes '.number_format($points,1).' points.';
        if (($evidence['certification']['status'] ?? '') === 'unknown') $messages[] = 'Certification evidence is unavailable and is not treated as verified.';
        if (($evidence['skill']['status'] ?? '') === 'experience') $messages[] = 'Skill fit is inferred from prior same-service work, not an explicit qualification claim.';
        return $messages;
    }
}
