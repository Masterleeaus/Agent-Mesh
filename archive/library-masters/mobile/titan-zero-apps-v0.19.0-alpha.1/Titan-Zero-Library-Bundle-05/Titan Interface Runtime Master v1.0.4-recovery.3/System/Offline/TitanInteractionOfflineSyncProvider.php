<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Offline;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkProviderContract;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkItemReference;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkProviderHealth;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkProviderResult;
use Illuminate\Contracts\Container\Container;

final readonly class TitanInteractionOfflineSyncProvider implements GlobalWorkProviderContract
{
    private const PROVIDER_KEY='titan-interface-runtime:interaction-engine-sync';
    private const ENGINE='App\\Extensions\\InteractionEngine\\System\\Offline\\SyncEngine';
    public function __construct(private Container $container){}
    public function fetch(InterfaceContext $context,string $tray,int $limit):GlobalWorkProviderResult
    {
        if($tray!=='sync')return new GlobalWorkProviderResult([],new GlobalWorkProviderHealth(self::PROVIDER_KEY,'healthy',null,0));
        if(!class_exists(self::ENGINE))return new GlobalWorkProviderResult([],new GlobalWorkProviderHealth(self::PROVIDER_KEY,'unavailable','Interaction Engine offline sync runtime is not installed.',0));
        try{$engine=$this->container->make(self::ENGINE);if(!method_exists($engine,'getStatus'))throw new \RuntimeException('Interaction Engine sync status contract is unavailable.');$raw=$engine->getStatus((string)$context->companyId);}catch(\Throwable){return new GlobalWorkProviderResult([],new GlobalWorkProviderHealth(self::PROVIDER_KEY,'degraded','Interaction Engine sync status could not be read.',0));}
        if(!is_array($raw))return new GlobalWorkProviderResult([],new GlobalWorkProviderHealth(self::PROVIDER_KEY,'degraded','Interaction Engine returned invalid sync status.',0));
        $pending=max(0,(int)($raw['pending']??0));$wizard=max(0,(int)($raw['wizard_pending']??0));$failed=max(0,(int)($raw['failed']??0));
        $state=match((string)($raw['state']??'')){'pending_sync'=>'pending-sync','synced'=>'synced','conflict_or_failed'=>'failed',default=>'unknown'};
        $summary=$failed>0?"{$failed} offline operation(s) require attention.":(($pending+$wizard)>0?($pending+$wizard).' offline operation(s) are waiting to sync.':'Offline queue is synchronized.');
        $item=new GlobalWorkItemReference('sync','interaction-engine-sync-status','interaction-engine','offline-sync:'.(string)$context->companyId,'Interaction Engine sync',500,0,$context->companyId,summary:$summary,metadata:[
            'state'=>$state,'network_state'=>'unknown','queued_count'=>$pending+$wizard,'attempts'=>0,'pending'=>$pending,'wizard_pending'=>$wizard,'failed'=>$failed,
            'synced'=>max(0,(int)($raw['synced']??0)),'sync_required'=>(bool)($raw['sync_required']??false),'oldest_pending_age_seconds'=>max(0,(int)($raw['oldest_pending_age_seconds']??0)),
        ]);
        return new GlobalWorkProviderResult([$item],new GlobalWorkProviderHealth(self::PROVIDER_KEY,$failed>0?'degraded':'healthy',null,1));
    }
}
