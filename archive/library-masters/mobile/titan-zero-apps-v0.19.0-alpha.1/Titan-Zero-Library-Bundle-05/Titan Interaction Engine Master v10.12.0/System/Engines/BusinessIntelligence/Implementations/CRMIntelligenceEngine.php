<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\CrmReadModelGatewayInterface;
use App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\CRMIntelligenceEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
final class CRMIntelligenceEngine implements CRMIntelligenceEngineInterface
{
    public function __construct(private readonly CompanyExecutionContext$tenantContext,private readonly ?CrmReadModelGatewayInterface$crm=null){}
    public function getCustomerInsights(int$customerId):array
    {
        if($this->crm===null)return['status'=>'unavailable','customer_id'=>$customerId,'reason'=>'CRM read-model gateway is not available.'];
        $ctx=$this->context();$customer=$this->crm->customer((string)$customerId,$ctx);$orders=$this->crm->workOrders(['customer_id'=>$customerId],$ctx,100);
        return['status'=>$customer===null?'not_found':'available','customer'=>$customer,'work_order_count'=>count($orders),'segment'=>$customer['segment']??'unknown'];
    }
    public function predictChurn(int$customerId):float{throw new \RuntimeException('Churn prediction requires an authoritative CRM analytics capability; Interaction Engine will not infer it from duplicated tables.');}
    public function getCustomerSegment(int$customerId):string{$insights=$this->getCustomerInsights($customerId);return(string)($insights['segment']??'unknown');}
    private function context():CapabilityExecutionContext{return new CapabilityExecutionContext($this->tenantContext->companyId(),'crm-intelligence','system',[],['crm:read'],'system','');}
}
