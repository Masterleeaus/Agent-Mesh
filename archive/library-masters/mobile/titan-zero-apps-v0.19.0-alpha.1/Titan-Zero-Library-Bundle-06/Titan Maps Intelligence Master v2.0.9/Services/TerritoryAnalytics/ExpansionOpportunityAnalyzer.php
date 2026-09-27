<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics;

final class ExpansionOpportunityAnalyzer
{
    public const METHODOLOGY_KEY='expansion_opportunity_weighted_evidence'; public const METHODOLOGY_VERSION='1.0';
    private const DEFAULT_WEIGHTS=['demand'=>0.35,'coverage_gap'=>0.30,'competitor_pressure'=>0.15,'supplier_access'=>0.10,'branch_distance'=>0.10];
    public function analyse(array $cells,array $context=[]): array
    {
        $w=(array)($context['weights']??self::DEFAULT_WEIGHTS);$target=max(1,(int)($context['target_provider_count']??3));$compCeiling=max(0.1,(float)($context['competitor_density_ceiling']??4.0));$branchCeiling=max(1.0,(float)($context['branch_distance_ceiling_km']??30.0));
        $jobs=array_values(array_filter(array_map(fn($c)=>$c['job_count']??null,$cells),fn($v)=>$v!==null));$maxJobs=$jobs?max(1,max(array_map('intval',$jobs))):null;$out=[];
        foreach($cells as $cell){$available=0;$dimensions=[];
            $job=array_key_exists('job_count',$cell)&&$cell['job_count']!==null?(int)$cell['job_count']:null;if($job!==null){$dimensions['demand']=min(1.0,$job/$maxJobs);$available++;}else$dimensions['demand']=0.0;
            $providers=(int)($cell['provider_count']??0)+(int)($cell['internal_count']??0);$dimensions['coverage_gap']=1.0-min(1.0,$providers/$target);$available++;
            $area=max(0.000001,(float)($cell['area_square_km']??1));$density=(int)($cell['competitor_count']??0)/$area;$dimensions['competitor_pressure']=1.0-min(1.0,$density/$compCeiling);$available++;
            $eta=isset($cell['supplier_eta_seconds'])&&is_numeric($cell['supplier_eta_seconds'])?(int)$cell['supplier_eta_seconds']:null;if($eta!==null){$dimensions['supplier_access']=max(0.0,1.0-min(1.0,$eta/3600));$available++;}else$dimensions['supplier_access']=0.0;
            $dist=isset($cell['branch_distance_km'])&&is_numeric($cell['branch_distance_km'])?(float)$cell['branch_distance_km']:null;if($dist!==null){$dimensions['branch_distance']=min(1.0,$dist/$branchCeiling);$available++;}else$dimensions['branch_distance']=0.0;
            $score=0.0;foreach(self::DEFAULT_WEIGHTS as $key=>$default){$score+=($dimensions[$key]??0.0)*(float)($w[$key]??$default);} $score*=100.0;
            $out[]=['cell_key'=>(string)($cell['cell_key']??''),'score'=>round($score,4),'metrics'=>['dimensions'=>$dimensions,'evidence_completeness'=>$available/5,'job_count'=>$job,'provider_internal_count'=>$providers,'competitor_density_per_square_km'=>$density,'supplier_eta_seconds'=>$eta,'branch_distance_km'=>$dist]];
        }
        usort($out,fn($a,$b)=>$b['score']<=>$a['score']);$avg=count($out)?array_sum(array_column($out,'score'))/count($out):0.0;$complete=count($out)?array_sum(array_map(fn($r)=>(float)$r['metrics']['evidence_completeness'],$out))/count($out):0.0;
        return ['methodology_key'=>self::METHODOLOGY_KEY,'methodology_version'=>self::METHODOLOGY_VERSION,'metrics'=>['average_opportunity_score'=>$avg,'evidence_completeness'=>$complete,'weights'=>$w],'findings'=>['top_opportunities'=>array_slice(array_map(fn($r)=>['cell_key'=>$r['cell_key'],'score'=>$r['score'],'evidence_completeness'=>$r['metrics']['evidence_completeness']],$out),0,10)],'cells'=>$out,'confidence'=>$complete];
    }
}
