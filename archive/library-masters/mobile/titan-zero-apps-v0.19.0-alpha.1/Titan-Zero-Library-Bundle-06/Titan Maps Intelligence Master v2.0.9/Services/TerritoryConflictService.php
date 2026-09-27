<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
final class TerritoryConflictService
{
    public function conflicts(array $resolvedMatches): array
    {
        $active=array_values(array_filter($resolvedMatches,static fn(array $m):bool=>($m['effect']??'include')==='include'));
        if(count($active)<2) return [];
        return [['type'=>'overlap','territory_ids'=>array_values(array_map(static fn(array $m):string=>(string)($m['id']??''),$active)),'count'=>count($active)]];
    }
}
