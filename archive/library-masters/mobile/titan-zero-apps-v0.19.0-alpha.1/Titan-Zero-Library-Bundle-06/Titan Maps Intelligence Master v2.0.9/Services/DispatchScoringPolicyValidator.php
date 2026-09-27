<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use InvalidArgumentException;
final class DispatchScoringPolicyValidator
{
    public const KEYS=['travel','skill','availability','workload','territory','continuity','urgency'];
    public function validate(array $weights): array
    {
        $keys=array_keys($weights); sort($keys); $expected=self::KEYS; sort($expected);
        if($keys!==$expected) throw new InvalidArgumentException('Dispatch scoring weights must contain exactly the supported signal keys.');
        $sum=0.0; foreach($weights as $k=>$v){if(!is_numeric($v)||(float)$v<0||(float)$v>100) throw new InvalidArgumentException("Invalid dispatch weight: {$k}"); $sum+=(float)$v;}
        if(abs($sum-100.0)>0.000001) throw new InvalidArgumentException('Dispatch scoring weights must sum to exactly 100.');
        return $weights;
    }
    public function temporalFactors(array $input): array
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
}
