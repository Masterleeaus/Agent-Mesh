<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final class TerritoryGridBuilder
{
    public function build(array $bounds,float $cellSizeKm=5.0,int $maximumCells=25): array
    {
        foreach(['north','south','east','west'] as $key) if(!isset($bounds[$key])||!is_numeric($bounds[$key])) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_ANALYTICS_AREA_INVALID','Territory analytics requires numeric north/south/east/west bounds.');
        $north=(float)$bounds['north'];$south=(float)$bounds['south'];$east=(float)$bounds['east'];$west=(float)$bounds['west'];
        if($north<=$south||$east<=$west||$north>90||$south<-90||$east>180||$west<-180) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_ANALYTICS_AREA_INVALID','Territory analytics bounds are invalid.');
        $cellSizeKm=max(0.25,$cellSizeKm);$maximumCells=max(1,$maximumCells);$mid=($north+$south)/2.0;$heightKm=($north-$south)*111.32;$widthKm=($east-$west)*111.32*max(0.01,cos(deg2rad($mid)));
        $rows=max(1,(int)ceil($heightKm/$cellSizeKm));$cols=max(1,(int)ceil($widthKm/$cellSizeKm));
        if($rows*$cols>$maximumCells){$scale=sqrt(($rows*$cols)/$maximumCells);$rows=max(1,(int)ceil($rows/$scale));$cols=max(1,(int)ceil($cols/$scale));while($rows*$cols>$maximumCells){if($cols>=$rows)$cols--;else$rows--;}}
        $latStep=($north-$south)/$rows;$lngStep=($east-$west)/$cols;$cells=[];
        for($r=0;$r<$rows;$r++){for($c=0;$c<$cols;$c++){$cellNorth=$north-($r*$latStep);$cellSouth=$north-(($r+1)*$latStep);$cellWest=$west+($c*$lngStep);$cellEast=$west+(($c+1)*$lngStep);$lat=($cellNorth+$cellSouth)/2;$lng=($cellWest+$cellEast)/2;$h=abs($cellNorth-$cellSouth)*111.32;$w=abs($cellEast-$cellWest)*111.32*max(0.01,cos(deg2rad($lat)));
            $cells[]=['cell_key'=>sprintf('r%02dc%02d',$r,$c),'row'=>$r,'column'=>$c,'north'=>$cellNorth,'south'=>$cellSouth,'east'=>$cellEast,'west'=>$cellWest,'center_latitude'=>$lat,'center_longitude'=>$lng,'area_square_km'=>max(0.000001,$h*$w)];}}
        return $cells;
    }

    public function locate(array $cells,float $lat,float $lng): ?int
    { foreach($cells as $i=>$cell) if($lat<=(float)$cell['north']&&$lat>=(float)$cell['south']&&$lng>=(float)$cell['west']&&$lng<=(float)$cell['east']) return $i; return null; }
}
