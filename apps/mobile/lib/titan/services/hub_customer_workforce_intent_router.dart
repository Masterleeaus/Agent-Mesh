import '../models/hub_customer_request.dart';
import '../models/hub_customer_workforce_intent.dart';
import '../models/workforce_context.dart';

class HubCustomerWorkforceIntentRouter {
  const HubCustomerWorkforceIntentRouter();

  HubCustomerWorkforceIntent route({
    required String companyId,
    required TitanHubCustomerRequest request,
  }){
    if(companyId.trim().isEmpty||request.customerId.trim().isEmpty){
      throw StateError('Hub workforce intent requires company_id and customer binding');
    }
    final binding=_binding(request.type);
    return HubCustomerWorkforceIntent(
      companyId:companyId,
      customerId:request.customerId,
      agentId:binding.$1.agentId!,
      capability:binding.$2,
      intentType:request.type,
      requestId:request.requestId,
      serviceId:request.serviceId,
    );
  }

  (TitanWorkforceContext,String) _binding(String type){
    switch(type){
      case 'booking':
      case 'reschedule':
      case 'cancel':
      case 'access_confirmation':
      case 'service_change':
        return (TitanWorkforceContext.access,'booking.manage');
      case 'message':
        return (TitanWorkforceContext.customerCare,'customer.manage');
      default:
        throw StateError('Hub request type is not customer-workforce routable');
    }
  }
}
