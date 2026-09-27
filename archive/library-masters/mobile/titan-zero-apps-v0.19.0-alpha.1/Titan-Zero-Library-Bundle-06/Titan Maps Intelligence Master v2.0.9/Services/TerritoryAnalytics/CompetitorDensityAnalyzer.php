<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics;

final class CompetitorDensityAnalyzer
{
    public const METHODOLOGY_KEY='competitor_density_area'; public const METHODOLOGY_VERSION='2.0';
    public function analyse(array $cells,array $context=[]): array
    {
        $total=0;$area=0.0;$out=[];$densities=[];
        foreach($cells as $cell){$count=(int)($cell['competitor_count']??0);$a=max(0.000001,(float)($cell['area_square_km']??0));$d=$count/$a;$total+=$count;$area+=$a;$densities[]=$d;$out[]=['cell_key'=>(string)($cell['cell_key']??''),'score'=>$d,'metrics'=>['competitor_count'=>$count,'area_square_km'=>$a,'competitors_per_square_km'=>$d]];}
        $threshold=(float)($context['high_density_threshold']??($densities?max(1.0,array_sum($densities)/count($densities)):1.0));
        return ['methodology_key'=>self::METHODOLOGY_KEY,'methodology_version'=>self::METHODOLOGY_VERSION,'metrics'=>['competitor_count'=>$total,'area_square_km'=>$area,'competitors_per_square_km'=>$area>0?$total/$area:0.0,'high_density_threshold'=>$threshold],'findings'=>['high_density_cell_keys'=>array_values(array_map(fn($r)=>$r['cell_key'],array_filter($out,fn($r)=>$r['metrics']['competitors_per_square_km']>=$threshold)))],'cells'=>$out,'confidence'=>count($cells)?1.0:0.0];
    }
}
