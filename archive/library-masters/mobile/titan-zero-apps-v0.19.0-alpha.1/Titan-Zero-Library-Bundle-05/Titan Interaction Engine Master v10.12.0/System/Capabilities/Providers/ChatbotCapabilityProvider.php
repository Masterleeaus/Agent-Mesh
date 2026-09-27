<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities\Providers;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\ChatbotCapabilityGatewayInterface;
final class ChatbotCapabilityProvider extends AbstractGatewayCapabilityProvider
{
    public function __construct(?ChatbotCapabilityGatewayInterface $gateway=null){$p='chatbot';$f='system_configuration';$d=[];
        foreach(['chatbot.identity.read','chatbot.knowledge.read','chatbot.capabilities.read','chatbot.experience.read','chatbot.handoff.read','chatbot.preview','chatbot.readiness'] as$c)$d[$c]=DescriptorFactory::read($c,$p,$f);
        foreach(['chatbot.identity.update','chatbot.knowledge.website.add','chatbot.knowledge.file.add','chatbot.knowledge.text.add','chatbot.knowledge.qa.add','chatbot.capabilities.update','chatbot.experience.update','chatbot.handoff.update','chatbot.channels.associate'] as$c)$d[$c]=DescriptorFactory::write($c,$p,'medium','approval_required',true,'online_required',$f);
        $d['chatbot.activate']=DescriptorFactory::write('chatbot.activate',$p,'high','approval_required',true,'online_required',$f,true);
        parent::__construct($d,$gateway);} public function providerKey():string{return'chatbot';}
}
