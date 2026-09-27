<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities\Providers;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\MobileCapabilityGatewayInterface;
final class MobileCapabilityProvider extends AbstractGatewayCapabilityProvider
{
    public function __construct(?MobileCapabilityGatewayInterface $gateway=null){$p='mobile';$f='system_configuration';$d=[];
        foreach(['mobile.application.readiness','mobile.device.status'] as$c)$d[$c]=DescriptorFactory::read($c,$p,$f);
        foreach(['mobile.worker.invite','mobile.owner.activate','mobile.customer.activate','mobile.notification.configure','mobile.installation.link'] as$c)$d[$c]=DescriptorFactory::write($c,$p,'medium','approval_required',true,'online_required',$f);
        parent::__construct($d,$gateway);} public function providerKey():string{return'mobile';}
}
