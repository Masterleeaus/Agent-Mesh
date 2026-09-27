<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Experience;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\AttentionHudProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkTrayAggregatorContract;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkItemReference;

final readonly class AttentionHudProjector implements AttentionHudProjectorContract
{
    public function __construct(private GlobalWorkTrayAggregatorContract $globalWork) {}

    public function project(InterfaceContext $context, int $limit = 8): AttentionHudSnapshot
    {
        if($limit<1||$limit>20) throw new \InvalidArgumentException('HUD limit must be between 1 and 20.');
        $items=[];$statuses=[];
        foreach(['attention','approvals','sync'] as $tray){
            $snapshot=$this->globalWork->aggregate($context,$tray,min(20,max($limit,5)));
            $statuses[$tray]=$snapshot->status;
            foreach($snapshot->items as $item){
                if(!$item instanceof GlobalWorkItemReference) continue;
                $row=$item->jsonSerialize();$row['hud_tray']=$tray;$row['executable']=false;$items[]=$row;
            }
        }
        usort($items,static fn(array $a,array $b):int=>[$b['priority'],$b['occurred_at'],$a['dedupe_key']]<=>[$a['priority'],$a['occurred_at'],$b['dedupe_key']]);
        $truncated=count($items)>$limit;
        return new AttentionHudSnapshot(array_slice($items,0,$limit),$statuses,$truncated);
    }
}
