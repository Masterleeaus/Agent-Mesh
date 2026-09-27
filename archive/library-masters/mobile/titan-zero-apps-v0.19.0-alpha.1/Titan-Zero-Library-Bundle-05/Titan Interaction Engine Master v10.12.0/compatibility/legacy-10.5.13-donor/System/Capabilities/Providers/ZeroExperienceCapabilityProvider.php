<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Capabilities\Providers;

use App\Extensions\InteractionEngine\System\Capabilities\Contracts\ZeroExperienceCapabilityGatewayInterface;

final class ZeroExperienceCapabilityProvider extends AbstractGatewayCapabilityProvider
{
    public function __construct(?ZeroExperienceCapabilityGatewayInterface $gateway=null) {
        $p='zero'; $f='system_configuration'; $d=[];
        foreach(['zero.identity.read','zero.knowledge.read','zero.capabilities.read','zero.experience.read','zero.handoff.read','zero.preview','zero.readiness'] as $c) $d[$c]=DescriptorFactory::read($c,$p,$f);
        foreach(['zero.identity.update','zero.knowledge.website.add','zero.knowledge.file.add','zero.knowledge.text.add','zero.knowledge.qa.add','zero.capabilities.update','zero.experience.update','zero.handoff.update','zero.channels.associate'] as $c) $d[$c]=DescriptorFactory::write($c,$p,'medium','approval_required',true,'online_required',$f);
        $d['zero.activate']=DescriptorFactory::write('zero.activate',$p,'high','approval_required',true,'online_required',$f,true);
        parent::__construct($d,$gateway);
    }
    public function providerKey(): string { return 'zero'; }
}
