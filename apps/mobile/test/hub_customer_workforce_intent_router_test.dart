import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile/titan/models/hub_customer_request.dart';
import 'package:titan_mobile/titan/services/hub_customer_workforce_intent_router.dart';
import 'package:titan_mobile/titan/validation/hub_customer_workforce_intent_contract.dart';

void main(){
  const router=HubCustomerWorkforceIntentRouter();

  TitanHubCustomerRequest request(String type)=>TitanHubCustomerRequest(
    requestId:'req-1',type:type,customerId:'customer-1',
    serviceId:type=='message'?null:'service-1',
    summary:'Customer request',requestedOutcome:'Requested outcome',
    createdAt:DateTime.utc(2026,9,20),
  );

  test('booking and reschedule bind canonical access agent',(){
    for(final type in ['booking','reschedule']){
      final intent=router.route(companyId:'company-1',request:request(type));
      expect(intent.agentId,'TZAG-OPS-ACCESS-FAILURE-PREVENTION');
      expect(intent.capability,'booking.manage');
      HubCustomerWorkforceIntentContract.validate(intent);
    }
  });

  test('customer message binds canonical customer-care agent',(){
    final intent=router.route(companyId:'company-1',request:request('message'));
    expect(intent.agentId,'TZAG-CX-CUSTOMER-EXPECTATION-MANAGEMENT');
    expect(intent.capability,'customer.manage');
    HubCustomerWorkforceIntentContract.validate(intent);
  });

  test('unsupported Hub request fails closed',(){
    expect(()=>router.route(companyId:'company-1',request:request('internal_dispatch')),
      throwsStateError);
  });

  test('command context cannot grant authority',(){
    final intent=router.route(companyId:'company-1',request:request('reschedule'));
    final ctx=intent.toCommandContext();
    expect(ctx['authority_granted'],false);
    expect(ctx['requires_command_bus'],true);
    expect(ctx['surface'],'hub');
  });
}
