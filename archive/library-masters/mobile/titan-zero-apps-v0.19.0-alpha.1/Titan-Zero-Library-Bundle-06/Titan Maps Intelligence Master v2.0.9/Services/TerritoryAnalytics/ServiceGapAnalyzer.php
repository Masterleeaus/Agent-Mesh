<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics;

final class ServiceGapAnalyzer
{
    public const METHODOLOGY_KEY='service_gap_demand_coverage'; public const METHODOLOGY_VERSION='2.0';
    public function analyse(array $cells,array $context=[]): array
    {
        $target=max(1,(int)($context['target_provider_count']??3));$knownJobs=array_values(array_filter(array_map(fn($c)=>$c['job_count']??null,$cells),fn($v)=>$v!==null));$maxJobs=$knownJobs?max(1,max(array_map('intval',$knownJobs))):null;$out=[];$knownDemand=0;
        foreach($cells as $cell){$providers=(int)($cell['provider_count']??0)+(int)($cell['internal_count']??0);$coverage=min(1.0,$providers/$target);$job=array_key_exists('job_count',$cell)&&$cell['job_count']!==null?(int)$cell['job_count']:null;$demandStatus=$job===null?'unavailable':'observed';
            if($job!==null){$knownDemand++;$demand=min(1.0,$job/$maxJobs);$score=100.0*((0.60*$demand)+(0.40*(1.0-$coverage)));$basis='demand_plus_coverage';}
            else{$demand=null;$score=40.0*(1.0-$coverage);$basis='coverage_only_demand_unavailable';}
            $out[]=['cell_key'=>(string)($cell['cell_key']??''),'score'=>round($score,4),'metrics'=>['job_count'=>$job,'demand_status'=>$demandStatus,'demand_normalised'=>$demand,'provider_internal_count'=>$providers,'coverage_score'=>$coverage,'score_basis'=>$basis]];
        }
        usort($out,fn($a,$b)=>$b['score']<=>$a['score']);$total=count($cells);
        return ['methodology_key'=>self::METHODOLOGY_KEY,'methodology_version'=>self::METHODOLOGY_VERSION,'metrics'=>['target_provider_count'=>$target,'demand_evidence_cells'=>$knownDemand,'demand_unavailable_cells'=>$total-$knownDemand,'demand_status'=>$knownDemand===0?'unavailable':($knownDemand===$total?'complete':'partial')],'findings'=>['highest_gap_cells'=>array_slice(array_map(fn($r)=>['cell_key'=>$r['cell_key'],'score'=>$r['score']],$out),0,10)],'cells'=>$out,'confidence'=>$total?($knownDemand/$total):0.0];
    }
}
