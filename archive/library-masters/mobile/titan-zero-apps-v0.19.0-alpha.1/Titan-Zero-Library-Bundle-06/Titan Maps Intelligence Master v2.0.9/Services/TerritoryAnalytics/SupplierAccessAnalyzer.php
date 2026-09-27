<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalytics;

final class SupplierAccessAnalyzer
{
    public const METHODOLOGY_KEY='supplier_access_travel_time_bands'; public const METHODOLOGY_VERSION='2.0';
    public function analyse(array $cells,array $context=[]): array
    {
        $bands=['0_15_minutes'=>0,'15_30_minutes'=>0,'30_45_minutes'=>0,'over_45_minutes'=>0,'unavailable'=>0];$out=[];$known=0;
        foreach($cells as $cell){$eta=isset($cell['supplier_eta_seconds'])&&is_numeric($cell['supplier_eta_seconds'])?(int)$cell['supplier_eta_seconds']:null;
            $band=$eta===null?'unavailable':($eta<=900?'0_15_minutes':($eta<=1800?'15_30_minutes':($eta<=2700?'30_45_minutes':'over_45_minutes')));$bands[$band]++;if($eta!==null)$known++;
            $score=$eta===null?0.0:max(0.0,100.0-min(100.0,($eta/2700)*100.0));
            $out[]=['cell_key'=>(string)($cell['cell_key']??''),'score'=>$score,'metrics'=>['supplier_eta_seconds'=>$eta,'travel_time_band'=>$band,'travel_time_status'=>$eta===null?'unavailable':'available','supplier_distance_metres'=>$cell['supplier_distance_metres']??null,'travel_basis'=>$cell['supplier_travel_basis']??($eta===null?'unavailable':'provider_or_stale')]];
        }
        $total=count($cells);$within30=$bands['0_15_minutes']+$bands['15_30_minutes'];
        return ['methodology_key'=>self::METHODOLOGY_KEY,'methodology_version'=>self::METHODOLOGY_VERSION,'metrics'=>['travel_time_bands'=>$bands,'cells_with_eta'=>$known,'cells_without_eta'=>$total-$known,'within_30_minutes_ratio'=>$total?($within30/$total):0.0],'findings'=>['unavailable_cell_keys'=>array_values(array_map(fn($r)=>$r['cell_key'],array_filter($out,fn($r)=>$r['metrics']['travel_time_status']==='unavailable')))],'cells'=>$out,'confidence'=>$total?($known/$total):0.0];
    }
}
