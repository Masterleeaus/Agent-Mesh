<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics;

final class ProviderCoverageAnalyzer
{
    public const METHODOLOGY_KEY = 'provider_coverage_cells';
    public const METHODOLOGY_VERSION = '2.0';

    public function analyse(array $cells, array $context = []): array
    {
        $total = count($cells); $covered = 0; $providers = 0; $internal = 0; $area = 0.0; $out=[];
        foreach ($cells as $cell) {
            $provider=(int)($cell['provider_count']??0); $inside=(int)($cell['internal_count']??0); $cellArea=max(0.000001,(float)($cell['area_square_km']??0));
            $isCovered=($provider+$inside)>0; if($isCovered)$covered++; $providers+=$provider; $internal+=$inside; $area+=$cellArea;
            $out[]=['cell_key'=>(string)($cell['cell_key']??''),'score'=>$isCovered?100.0:0.0,'metrics'=>['provider_count'=>$provider,'internal_count'=>$inside,'covered'=>$isCovered,'area_square_km'=>$cellArea,'providers_per_square_km'=>$provider/$cellArea]];
        }
        return ['methodology_key'=>self::METHODOLOGY_KEY,'methodology_version'=>self::METHODOLOGY_VERSION,'metrics'=>[
            'total_cells'=>$total,'covered_cells'=>$covered,'uncovered_cells'=>max(0,$total-$covered),'covered_cell_ratio'=>$total?($covered/$total):0.0,
            'provider_count'=>$providers,'internal_count'=>$internal,'area_square_km'=>$area,'providers_per_square_km'=>$area>0?$providers/$area:0.0,
        ],'findings'=>['uncovered_cell_keys'=>array_values(array_map(fn($r)=>$r['cell_key'],array_filter($out,fn($r)=>!$r['metrics']['covered'])))],'cells'=>$out,'confidence'=>$total?1.0:0.0];
    }
}
