<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

/**
 * Shared, presentation-only normalization and chronological ordering for app activity.
 * Owning runtimes/providers remain authoritative for the underlying records.
 */
final class AppOperatingTimelinePolicy
{
    /**
     * @param list<array<string,mixed>> $items
     * @return list<array<string,mixed>>
     */
    public function merge(array $items,int $limit=200): array
    {
        $normalized=[];
        $seen=[];
        foreach($items as $item){
            if(!is_array($item)) continue;
            $id=trim((string)($item['id']??''));
            $kind=trim((string)($item['kind']??'activity'));
            if($id==='') $id='timeline:'.hash('sha256',$kind.'|'.json_encode($item,JSON_UNESCAPED_SLASHES));
            $dedupe=$kind.'|'.$id;
            if(isset($seen[$dedupe])) continue;
            $seen[$dedupe]=true;

            $normalized[]=[
                'id'=>$id,
                'kind'=>$kind,
                'title'=>trim((string)($item['title']??'Activity')),
                'summary'=>$this->nullableString($item['summary']??null),
                'state'=>trim((string)($item['state']??'unknown')),
                'occurred_at'=>$this->nullableString($item['occurred_at']??null),
                'actor'=>$this->nullableString($item['actor']??null),
                'source'=>$this->nullableString($item['source']??null),
                'reference'=>$this->nullableString($item['reference']??null),
                'resumable'=>(bool)($item['resumable']??false),
                'requires_attention'=>(bool)($item['requires_attention']??false),
                'receipt_id'=>$this->nullableString($item['receipt_id']??null),
                'metadata'=>is_array($item['metadata']??null)?$item['metadata']:[],
                'execution_authority'=>false,
            ];
        }

        usort($normalized,function(array $a,array $b): int {
            $ta=$this->timestamp($a['occurred_at']);
            $tb=$this->timestamp($b['occurred_at']);
            if($ta===null && $tb===null) return strcmp($a['id'],$b['id']);
            if($ta===null) return 1;
            if($tb===null) return -1;
            if($ta===$tb) return strcmp($a['id'],$b['id']);
            return $ta<=>$tb;
        });

        return array_slice($normalized,0,max(1,min(500,$limit)));
    }

    private function timestamp(?string $value): ?int
    {
        if($value===null||trim($value)==='') return null;
        $ts=strtotime($value);
        return $ts===false?null:$ts;
    }

    private function nullableString(mixed $value): ?string
    {
        if(!is_scalar($value)) return null;
        $value=trim((string)$value);
        return $value===''?null:$value;
    }
}
