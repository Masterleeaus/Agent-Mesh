<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\DTO\ResourceFallbackScoreResult;

final class ResourceFallbackScoreService
{
    private const WEIGHTS=['service'=>45.0,'travel'=>40.0,'completeness'=>10.0,'reputation'=>5.0];

    /** @param array<string,mixed> $candidate */
    public function score(array $candidate): ResourceFallbackScoreResult
    {
        $serviceStatus=(string)($candidate['service_evidence']??'unknown');
        $service=$serviceStatus==='unknown' ? 0.35 : $this->clamp((float)($candidate['service_match']??0.0));

        $eta=$this->intOrNull($candidate['duration_seconds']??null);
        $road=$this->intOrNull($candidate['distance_metres']??null);
        $straight=$this->intOrNull($candidate['straight_line_distance_metres']??null);
        $etaBasis=(string)($candidate['eta_basis']??'unavailable');
        if($eta!==null && $etaBasis!=='unavailable') $travel=$this->inverse($eta,900,5400);
        elseif($road!==null) $travel=$this->inverse($road,5000,50000);
        elseif($straight!==null) $travel=0.65*$this->inverse($straight,5000,50000);
        else $travel=0.0;

        $completeness=$this->clamp((float)($candidate['data_completeness']??0.0));
        $rating=is_numeric($candidate['rating']??null)?(float)$candidate['rating']:null;
        $reviews=max(0,(int)($candidate['review_count']??0));
        $reputation=$rating===null ? 0.0 : $this->clamp(($rating/5.0)*min(1.0,log10(max(1,$reviews)+1)/2.0));

        $dimensions=[
            'service'=>round(self::WEIGHTS['service']*$service,2),
            'travel'=>[
                'score'=>round(self::WEIGHTS['travel']*$travel,2),
                'road_distance_metres'=>$road,
                'straight_line_distance_metres'=>$straight,
                'duration_seconds'=>$eta,
            ],
            'completeness'=>round(self::WEIGHTS['completeness']*$completeness,2),
            'reputation'=>round(self::WEIGHTS['reputation']*$reputation,2),
        ];
        $total=round((float)$dimensions['service']+(float)$dimensions['travel']['score']+(float)$dimensions['completeness']+(float)$dimensions['reputation'],2);
        $evidence=[
            'source'=>(string)($candidate['source']??'unknown'),
            'service'=>['status'=>$serviceStatus,'match'=>$serviceStatus==='unknown'?null:$service],
            'travel'=>['eta_basis'=>$etaBasis,'duration_seconds'=>$eta,'road_distance_metres'=>$road,'straight_line_distance_metres'=>$straight],
            'completeness'=>['score'=>$completeness],
            'reputation'=>['rating'=>$rating,'review_count'=>$reviews],
        ];
        $explanations=[];
        if($serviceStatus==='unknown')$explanations[]='Service/category evidence is unknown and is not treated as verified.';
        if($eta===null)$explanations[]=$road!==null?'ETA unavailable; ranking uses road distance only.':($straight!==null?'Road ETA unavailable; ranking uses an explicitly discounted straight-line estimate.':'Travel evidence unavailable.');
        if($etaBasis==='stale_snapshot')$explanations[]='Travel ETA is retained evidence and is explicitly stale.';
        return new ResourceFallbackScoreResult($total,true,$dimensions,$evidence,$explanations);
    }

    private function intOrNull(mixed $value): ?int { return is_numeric($value)?(int)$value:null; }
    private function clamp(float $v): float { return max(0.0,min(1.0,$v)); }
    private function inverse(int $value,int $best,int $worst): float { if($value<=$best)return 1.0;if($value>=$worst)return 0.0;return $this->clamp(1-(($value-$best)/($worst-$best))); }
}
