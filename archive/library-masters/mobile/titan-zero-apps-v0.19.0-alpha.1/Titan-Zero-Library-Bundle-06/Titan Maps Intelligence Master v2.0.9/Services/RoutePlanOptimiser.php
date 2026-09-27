<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\DTO\RoutePlanOptimisation;
use App\Extensions\TitanMapsIntelligence\DTO\RoutePlanStopInput;
use DateTimeImmutable;
use DateTimeInterface;
use InvalidArgumentException;

final class RoutePlanOptimiser
{
    /**
     * @param array<int,RoutePlanStopInput> $stops
     * @param array<string,array{duration:int,distance:int}> $matrix
     */
    public function optimise(array $stops,array $matrix,string $startAt,?int $timeoutSeconds=null,?int $exactMaxStops=null): RoutePlanOptimisation
    {
        if(count($stops)<2) throw new InvalidArgumentException('A route plan requires at least two stops.');
        $timeoutSeconds=max(1,min(30,$timeoutSeconds ?? 5));
        $exactMaxStops=max(2,min(10,$exactMaxStops ?? 10));
        $started=microtime(true); $deadline=$started+$timeoutSeconds;
        $baseline=array_values($stops); usort($baseline,static fn(RoutePlanStopInput $a,RoutePlanStopInput $b):int=>$a->originalSequence<=>$b->originalSequence);
        $start=new DateTimeImmutable($startAt);
        if(count($baseline)<=$exactMaxStops){
            [$ordered,$timedOut]=$this->exactOrder($baseline,$matrix,$start,$deadline);
            return $this->result($baseline,$ordered,$matrix,$start,$timedOut?'exact_timeout_best_found_v2':'exact_permutation_v2',$timedOut,$timedOut,microtime(true)-$started);
        }
        [$ordered,$timedOut]=$this->heuristicOrder($baseline,$matrix,$start,$deadline);
        return $this->result($baseline,$ordered,$matrix,$start,'heuristic_locked_greedy_2opt_v2',true,$timedOut,microtime(true)-$started);
    }

    /** @return array{0:array<int,RoutePlanStopInput>,1:bool} */
    private function exactOrder(array $baseline,array $matrix,DateTimeImmutable $start,float $deadline): array
    {
        $positions=array_fill(0,count($baseline),null); $unlocked=[]; $holes=[];
        foreach($baseline as $pos=>$stop){ if($stop->locked||$pos===0)$positions[$pos]=$stop; else{$unlocked[]=$stop;$holes[]=$pos;} }
        $positions[0]=$baseline[0];
        $best=$baseline; $bestScore=$this->objective($baseline,$matrix,$start); $timedOut=false; $used=array_fill(0,count($unlocked),false); $current=[];
        $walk=function(int $depth) use (&$walk,&$best,&$bestScore,&$timedOut,&$used,&$current,$unlocked,$holes,$positions,$matrix,$start,$deadline):void{
            if(microtime(true)>=$deadline){$timedOut=true;return;}
            if($depth===count($unlocked)){
                $candidate=$positions; foreach($holes as $i=>$pos)$candidate[$pos]=$current[$i];
                /** @var array<int,RoutePlanStopInput> $candidate */
                $candidate=array_values($candidate); $score=$this->objective($candidate,$matrix,$start);
                if($score<$bestScore){$bestScore=$score;$best=$candidate;}
                return;
            }
            foreach($unlocked as $i=>$stop){ if($used[$i])continue; $used[$i]=true;$current[$depth]=$stop;$walk($depth+1);$used[$i]=false;if($timedOut)return; }
        };
        $walk(0);
        return [$best,$timedOut];
    }

    /** @return array{0:array<int,RoutePlanStopInput>,1:bool} */
    private function heuristicOrder(array $baseline,array $matrix,DateTimeImmutable $start,float $deadline): array
    {
        $positions=array_fill(0,count($baseline),null);$unlocked=[];$timedOut=false;
        foreach($baseline as $position=>$stop){if($stop->locked||$position===0)$positions[$position]=$stop;else$unlocked[]=$stop;}
        $positions[0]=$baseline[0];$unlocked=array_values(array_filter($unlocked,fn(RoutePlanStopInput $s):bool=>$s->id!==$baseline[0]->id));$clock=$start;
        for($position=1;$position<count($positions);$position++){
            if(microtime(true)>=$deadline){$timedOut=true;break;}
            if($positions[$position] instanceof RoutePlanStopInput){$previous=$positions[$position-1];if($previous instanceof RoutePlanStopInput)$clock=$this->advanceClock($clock,$previous,$positions[$position],$matrix);continue;}
            $previous=$positions[$position-1]; if(!$previous instanceof RoutePlanStopInput||$unlocked===[])break;
            $nextLocked=$this->nextLocked($positions,$position+1);$bestKey=null;$bestScore=PHP_INT_MAX;
            foreach($unlocked as $key=>$candidate){$edge=$this->edge($previous,$candidate,$matrix);$arrival=$clock->modify('+'.$edge['duration'].' seconds');$score=$edge['duration'];
                if($candidate->windowStart!==null){$ws=new DateTimeImmutable($candidate->windowStart);$we=new DateTimeImmutable((string)$candidate->windowEnd);if($arrival>$we)$score+=max(0,$arrival->getTimestamp()-$we->getTimestamp())*100;elseif($arrival<$ws)$score+=min(900,$ws->getTimestamp()-$arrival->getTimestamp());}
                if($nextLocked instanceof RoutePlanStopInput)$score+=(int)round($this->edge($candidate,$nextLocked,$matrix)['duration']*0.15);
                if($score<$bestScore||($score===$bestScore&&$candidate->originalSequence<($unlocked[$bestKey]->originalSequence??PHP_INT_MAX))){$bestScore=$score;$bestKey=$key;}
            }
            if($bestKey===null)break;$selected=$unlocked[$bestKey];unset($unlocked[$bestKey]);$unlocked=array_values($unlocked);$positions[$position]=$selected;$clock=$this->advanceClock($clock,$previous,$selected,$matrix);
        }
        foreach($positions as $i=>$stop){if($stop===null&&$unlocked!==[])$positions[$i]=array_shift($unlocked);} $ordered=array_values(array_filter($positions,fn($v):bool=>$v instanceof RoutePlanStopInput));
        // Bounded 2-opt on only non-locked positions.
        $improved=true; while($improved&&!$timedOut){$improved=false;$baseScore=$this->objective($ordered,$matrix,$start);for($i=1;$i<count($ordered)-1;$i++){if(microtime(true)>=$deadline){$timedOut=true;break;}if($ordered[$i]->locked)continue;for($j=$i+1;$j<count($ordered);$j++){if($ordered[$j]->locked)break;$candidate=$ordered;$slice=array_reverse(array_slice($candidate,$i,$j-$i+1));array_splice($candidate,$i,$j-$i+1,$slice);$score=$this->objective($candidate,$matrix,$start);if($score<$baseScore){$ordered=$candidate;$baseScore=$score;$improved=true;break 2;}}}}
        return [$ordered,$timedOut];
    }

    private function result(array $baseline,array $ordered,array $matrix,DateTimeImmutable $start,string $algorithm,bool $heuristic,bool $timedOut,float $elapsedSeconds): RoutePlanOptimisation
    {
        [$baseDuration,$baseDistance]=$this->travelMetrics($baseline,$matrix);[$optDuration,$optDistance]=$this->travelMetrics($ordered,$matrix);[$schedule,$violations]=$this->schedule($ordered,$matrix,$start);
        return new RoutePlanOptimisation($ordered,$baseDuration,$optDuration,$baseDistance,$optDistance,max(0,$baseDuration-$optDuration),max(0,$baseDistance-$optDistance),$schedule,$violations,$algorithm,$heuristic,$timedOut,(int)round($elapsedSeconds*1000));
    }

    private function objective(array $stops,array $matrix,DateTimeImmutable $start): int
    {
        [$duration]=$this->travelMetrics($stops,$matrix);[, $violations]=$this->schedule($stops,$matrix,$start);$late=0;foreach($violations as $v)$late+=(int)($v['late_seconds']??0);return $duration+($late*100);
    }
    /** @param array<int,RoutePlanStopInput|null> $positions */
    private function nextLocked(array $positions,int $from):?RoutePlanStopInput{for($i=$from;$i<count($positions);$i++)if($positions[$i] instanceof RoutePlanStopInput)return $positions[$i];return null;}
    private function edge(RoutePlanStopInput $from,RoutePlanStopInput $to,array $matrix):array{$key=$from->originalSequence.':'.$to->originalSequence;if(isset($matrix[$key]))return ['duration'=>max(0,(int)$matrix[$key]['duration']),'distance'=>max(0,(int)$matrix[$key]['distance'])];$distance=$this->haversineMetres($from->coordinates->latitude,$from->coordinates->longitude,$to->coordinates->latitude,$to->coordinates->longitude);return ['duration'=>(int)max(1,round($distance/11.111111)),'distance'=>$distance];}
    private function advanceClock(DateTimeImmutable $clock,RoutePlanStopInput $from,RoutePlanStopInput $to,array $matrix):DateTimeImmutable{$arrival=$clock->modify('+'.$from->serviceDurationSeconds.' seconds')->modify('+'.$this->edge($from,$to,$matrix)['duration'].' seconds');if($to->windowStart!==null){$ws=new DateTimeImmutable($to->windowStart);if($arrival<$ws)$arrival=$ws;}return $arrival;}
    private function travelMetrics(array $stops,array $matrix):array{$duration=0;$distance=0;for($i=1;$i<count($stops);$i++){$e=$this->edge($stops[$i-1],$stops[$i],$matrix);$duration+=$e['duration'];$distance+=$e['distance'];}return [$duration,$distance];}
    private function schedule(array $stops,array $matrix,DateTimeImmutable $start):array{$schedule=[];$violations=[];$clock=$start;foreach($stops as $i=>$stop){if($i>0){$previous=$stops[$i-1];$clock=$clock->modify('+'.$previous->serviceDurationSeconds.' seconds')->modify('+'.$this->edge($previous,$stop,$matrix)['duration'].' seconds');}$arrival=$clock;$waiting=0;$late=0;$status='on_time';if($stop->windowStart!==null){$ws=new DateTimeImmutable($stop->windowStart);$we=new DateTimeImmutable((string)$stop->windowEnd);if($arrival<$ws){$waiting=$ws->getTimestamp()-$arrival->getTimestamp();$arrival=$ws;$clock=$ws;$status='early_wait';}elseif($arrival>$we){$late=$arrival->getTimestamp()-$we->getTimestamp();$status='late';$violations[]=['stop_id'=>$stop->id,'late_seconds'=>$late,'window_end'=>$we->format(DateTimeInterface::ATOM)];}}$departure=$arrival->modify('+'.$stop->serviceDurationSeconds.' seconds');$schedule[]=['stop_id'=>$stop->id,'sequence'=>$i,'arrival_at'=>$arrival->format(DateTimeInterface::ATOM),'departure_at'=>$departure->format(DateTimeInterface::ATOM),'window_status'=>$status,'waiting_seconds'=>$waiting,'late_seconds'=>$late];}return [$schedule,$violations];}
    private function haversineMetres(float $lat1,float $lon1,float $lat2,float $lon2):int{$r=6371000.0;$p1=deg2rad($lat1);$p2=deg2rad($lat2);$dp=deg2rad($lat2-$lat1);$dl=deg2rad($lon2-$lon1);$a=sin($dp/2)**2+cos($p1)*cos($p2)*sin($dl/2)**2;return (int)round($r*2*atan2(sqrt($a),sqrt(max(0.0,1-$a))));}
}
