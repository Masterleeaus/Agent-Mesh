<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities\Providers;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\TitanAICapabilityGatewayInterface;
final class TitanAICapabilityProvider extends AbstractGatewayCapabilityProvider
{
    public function __construct(?TitanAICapabilityGatewayInterface $gateway=null){$p='titan_ai';$f='system_configuration';$d=[];
        foreach(['ai.authority.read','ai.model.policy.read','ai.readiness'] as$c)$d[$c]=DescriptorFactory::read($c,$p,$f);
        foreach(['ai.authority.update','ai.persona.defaults.update','ai.model.policy.update','ai.business.preferences.update'] as$c)$d[$c]=DescriptorFactory::write($c,$p,'high','approval_required',true,'online_required',$f,true);
        parent::__construct($d,$gateway);} public function providerKey():string{return'titan_ai';}
}
