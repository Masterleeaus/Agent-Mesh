<?php
declare(strict_types=1);
$root=dirname(__DIR__);
require $root.'/Services/DispatchScoringPolicyValidator.php';
use App\Extensions\TitanMapsIntelligence\Services\DispatchScoringPolicyValidator;
$v=new DispatchScoringPolicyValidator();
$clean=['travel'=>20,'skill'=>10,'availability'=>15,'workload'=>10,'territory'=>20,'continuity'=>15,'urgency'=>10];
$electrical=['travel'=>20,'skill'=>35,'availability'=>15,'workload'=>10,'territory'=>5,'continuity'=>10,'urgency'=>5];
if($v->validate($clean)!==$clean||$v->validate($electrical)!==$electrical){fwrite(STDERR,"valid policy rejected\n");exit(1);} 
try{$v->validate(array_merge($clean,['travel'=>21]));fwrite(STDERR,"invalid total accepted\n");exit(1);}catch(InvalidArgumentException){}
$temporal=$v->temporalFactors(['shift_end_seconds'=>900,'consecutive_jobs'=>6,'customer_familiarity_score'=>100,'time_until_available_seconds'=>0]);
if($temporal['fatigue']>=1.0||$temporal['familiarity']!==1.0||$temporal['availability_delay']!==1.0){fwrite(STDERR,"temporal factors failed\n");exit(1);} 
echo "beta1 dispatch policy runtime PASS\n";
