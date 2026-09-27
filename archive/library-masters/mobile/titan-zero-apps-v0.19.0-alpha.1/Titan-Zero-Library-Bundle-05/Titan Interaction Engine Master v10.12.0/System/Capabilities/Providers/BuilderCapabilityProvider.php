<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities\Providers;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\BuilderCapabilityGatewayInterface;
final class BuilderCapabilityProvider extends AbstractGatewayCapabilityProvider
{
    public function __construct(?BuilderCapabilityGatewayInterface $gateway=null){$p='builder';$f='system_configuration';$d=[];
        foreach(['builder.application.read','builder.brand.read','builder.navigation.read','builder.features.read','builder.theme.read','builder.preview','builder.validate','builder.readiness'] as$c)$d[$c]=DescriptorFactory::read($c,$p,$f);
        foreach(['builder.application.create','builder.application.configure','builder.brand.update','builder.navigation.update','builder.features.update','builder.theme.update','builder.vertical.apply'] as$c)$d[$c]=DescriptorFactory::write($c,$p,'medium','approval_required',true,'online_required',$f);
        foreach(['builder.publish','builder.rollback'] as$c)$d[$c]=DescriptorFactory::write($c,$p,'high','approval_required',true,'online_required',$f,true);
        parent::__construct($d,$gateway);} public function providerKey():string{return'builder';}
}
