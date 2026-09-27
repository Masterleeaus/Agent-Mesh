<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Capabilities\Providers;

use App\Extensions\InteractionEngine\System\Capabilities\Contracts\CrmCapabilityGatewayInterface;

final class CrmCapabilityProvider extends AbstractGatewayCapabilityProvider
{
    public function __construct(?CrmCapabilityGatewayInterface $gateway = null)
    {
        $p = 'crm'; $business = 'business_operations'; $config = 'system_configuration';
        $d = [];
        foreach (['crm.business.profile.read','crm.business.hours.read','crm.business.services.read','crm.business.service_area.read','crm.customer.search','crm.customer.read','crm.work_order.search','crm.work_order.read','crm.appointment.read','crm.quote.read','crm.invoice.read','crm.staff.read'] as $cap) $d[$cap] = DescriptorFactory::read($cap,$p,str_starts_with($cap,'crm.business.')?$config:$business);
        foreach (['crm.business.profile.update','crm.business.hours.update','crm.business.service.create','crm.business.service.update','crm.business.service_area.update','crm.business.service_area.create','crm.business.booking_rules.update','crm.business.payment_settings.update','crm.business.compliance.update'] as $cap) $d[$cap] = DescriptorFactory::write($cap,$p,'medium','approval_required',true,'online_required',$config);
        foreach (['crm.customer.create','crm.customer.update','crm.service_request.create','crm.work_order.create','crm.work_order.assign','crm.work_order.update','crm.work_order.complete','crm.work_order.material.add','crm.work_order.task.add','crm.work_order.task.update','crm.work_order.time.record','crm.form.submit','crm.evidence.add','crm.appointment.create','crm.appointment.reschedule','crm.quote.prepare','crm.quote.create','crm.quote.approve','crm.invoice.create','crm.invoice.issue','crm.payment.record','crm.support.create','crm.staff.invite','crm.staff.role.assign'] as $cap) {
            $offline = in_array($cap,['crm.work_order.update','crm.work_order.complete'],true) ? 'offline_queueable' : 'online_required';
            $d[$cap] = DescriptorFactory::write($cap,$p,'medium','approval_required',true,$offline,$business);
        }
        parent::__construct($d,$gateway);
    }
    public function providerKey(): string { return 'crm'; }
}
