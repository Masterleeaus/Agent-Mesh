<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities\Providers;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\ConnectCapabilityGatewayInterface;
final class ConnectCapabilityProvider extends AbstractGatewayCapabilityProvider
{
    public function __construct(?ConnectCapabilityGatewayInterface $gateway=null){$p='connect';$f='system_configuration';$d=[];
        $d['communications.connection.status']=DescriptorFactory::read('communications.connection.status',$p,$f);
        $d['communications.connection.start']=DescriptorFactory::write('communications.connection.start',$p,'high','user_only',true,'online_required',$f,true);
        foreach(['communications.customer.send','communications.work_order.send_update','communications.booking.send_confirmation','communications.invoice.send'] as$c)$d[$c]=DescriptorFactory::write($c,$p,'medium','approval_required',true,'online_required','business_operations');
        parent::__construct($d,$gateway);} public function providerKey():string{return'connect';}
}
