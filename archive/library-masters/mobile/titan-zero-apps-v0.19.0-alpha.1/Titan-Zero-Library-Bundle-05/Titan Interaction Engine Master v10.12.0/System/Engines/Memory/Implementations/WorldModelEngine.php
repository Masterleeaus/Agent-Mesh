<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Engines\Memory\Implementations;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\CrmReadModelGatewayInterface;
use App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\WorldModelEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use Illuminate\Support\Facades\Cache;
final class WorldModelEngine implements WorldModelEngineInterface
{
    private array$state=[];public function __construct(private readonly CompanyExecutionContext$tenantContext,private readonly ?CrmReadModelGatewayInterface$crm=null){}
    public function refresh():void
    {
        if($this->crm===null){$this->state=['customers'=>[],'work_orders'=>[],'availability'=>'unavailable'];Cache::put($this->cacheKey(),$this->state,60);return;}
        $ctx=new CapabilityExecutionContext($this->tenantContext->companyId(),'world-model','system',[],['crm:read'],'system','');
        $this->state=['customers'=>$this->crm->searchCustomers('',$ctx,100),'work_orders'=>$this->crm->workOrders([],$ctx,100),'availability'=>'available'];Cache::put($this->cacheKey(),$this->state,300);
    }
    public function getEntity(string$type,string$id):?array{$state=Cache::get($this->cacheKey(),$this->state);foreach((array)($state[$type]??[])as$entity)if((string)($entity['id']??$entity['public_id']??'')===$id)return(array)$entity;return null;}
    public function findEntities(string$type,array$criteria):array{$items=(array)(Cache::get($this->cacheKey(),$this->state)[$type]??[]);return array_values(array_filter($items,static function($item)use($criteria){foreach($criteria as$k=>$v)if(($item[$k]??null)!==$v)return false;return true;}));}
    public function getState():array{return(array)Cache::get($this->cacheKey(),$this->state);}
    private function cacheKey():string{return'interaction-engine:world_model:'.$this->tenantContext->companyId();}
}
