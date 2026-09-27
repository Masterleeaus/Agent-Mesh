<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Context\Providers;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\CrmReadModelGatewayInterface;
use App\Extensions\InteractionEngine\System\Contracts\ContextProviderInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
final class CustomerContextProvider implements ContextProviderInterface
{
    public function __construct(private readonly CompanyExecutionContext $tenantContext,private readonly ?CrmReadModelGatewayInterface $crm=null){}
    public function provide(array $state):array
    {
        $customerId=$this->answer($state,'customer_id')??$this->answer($state,'customer_public_id');if(!$customerId||$this->crm===null)return['customer'=>null,'availability'=>'unavailable'];
        $context=$this->executionContext($state);$customer=$this->crm->customer((string)$customerId,$context);return['customer'=>$customer,'availability'=>$customer===null?'not_found':'available'];
    }
    private function executionContext(array$state):CapabilityExecutionContext
    {
        $c=(array)($state['context']??$state['_context']??[]);$actorId=trim((string)($c['actor_id']??$c['user_id']??'interaction-context'));
        return new CapabilityExecutionContext($this->tenantContext->companyId(),$actorId,(string)($c['actor_type']??'system'),array_values((array)($c['roles']??[])),array_values((array)($c['scopes']??$c['delegated_scopes']??[])),(string)($c['source_surface']??'system'),(string)($c['correlation_id']??''),deviceId:isset($c['device_id'])?(string)$c['device_id']:null);
    }
    private function answer(array$state,string$key):mixed{foreach($state['answers']??[]as$answer){if(is_object($answer)&&($answer->questionKey??null)===$key)return$answer->value;if(is_array($answer)&&($answer['question_key']??null)===$key)return$answer['value']??null;}return$state['answers'][$key]??null;}
}
