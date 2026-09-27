<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Knowledge\Sources;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\CrmReadModelGatewayInterface;
use App\Extensions\InteractionEngine\System\Contracts\KnowledgeSourceInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
final class ServiceKnowledgeSource implements KnowledgeSourceInterface
{
    public function __construct(private readonly CompanyExecutionContext$tenantContext,private readonly ?CrmReadModelGatewayInterface$crm=null){}
    public function id():string{return'services';}public function supports(string$type):bool{return$type==='services';}
    public function query(string$query,array$context=[]):mixed{if($this->crm===null)return[];return$this->crm->services(trim($query),$this->context($context),20);}
    private function context(array$c):CapabilityExecutionContext{return new CapabilityExecutionContext($this->tenantContext->companyId(),trim((string)($c['actor_id']??$c['user_id']??'knowledge-read')),(string)($c['actor_type']??'system'),array_values((array)($c['roles']??[])),array_values((array)($c['scopes']??[])),(string)($c['source_surface']??'system'),(string)($c['correlation_id']??''));}
}
