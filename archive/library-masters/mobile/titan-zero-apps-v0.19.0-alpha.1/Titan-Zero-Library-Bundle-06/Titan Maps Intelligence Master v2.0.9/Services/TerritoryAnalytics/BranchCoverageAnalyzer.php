<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics;

final class BranchCoverageAnalyzer
{
    public const METHODOLOGY_KEY='branch_coverage_assignment'; public const METHODOLOGY_VERSION='1.0';
    public function analyse(array $cells,array $context=[]): array
    {
        $assigned=0;$unassigned=0;$by=[];$out=[];
        foreach($cells as $cell){$branch=isset($cell['branch_public_id'])&&trim((string)$cell['branch_public_id'])!==''?(string)$cell['branch_public_id']:null;if($branch){$assigned++;$by[$branch]=($by[$branch]??0)+1;}else$unassigned++;
            $distance=isset($cell['branch_distance_km'])?(float)$cell['branch_distance_km']:null;$out[]=['cell_key'=>(string)($cell['cell_key']??''),'score'=>$branch?100.0:0.0,'metrics'=>['branch_public_id'=>$branch,'branch_distance_km'=>$distance,'branch_distance_basis'=>$cell['branch_distance_basis']??($distance!==null?'straight_line':'unavailable'),'assigned'=>$branch!==null]];}
        $total=count($cells);ksort($by);
        return ['methodology_key'=>self::METHODOLOGY_KEY,'methodology_version'=>self::METHODOLOGY_VERSION,'metrics'=>['assigned_cells'=>$assigned,'unassigned_cells'=>$unassigned,'assigned_ratio'=>$total?($assigned/$total):0.0,'cells_by_branch'=>$by],'findings'=>['unassigned_cell_keys'=>array_values(array_map(fn($r)=>$r['cell_key'],array_filter($out,fn($r)=>!$r['metrics']['assigned'])))],'cells'=>$out,'confidence'=>$total?($assigned/$total):0.0];
    }
}
