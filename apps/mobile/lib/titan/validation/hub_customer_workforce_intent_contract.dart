import '../models/hub_customer_workforce_intent.dart';

class HubCustomerWorkforceIntentContract {
  static const _allowedAgents=<String>{
    'TZAG-CX-CUSTOMER-EXPECTATION-MANAGEMENT',
    'TZAG-OPS-ACCESS-FAILURE-PREVENTION',
  };
  static const _allowedCapabilities=<String>{
    'customer.manage','booking.manage',
  };

  static void validate(HubCustomerWorkforceIntent intent){
    if(intent.companyId.trim().isEmpty||intent.customerId.trim().isEmpty){
      throw StateError('Hub intent is not customer/company scoped');
    }
    if(!_allowedAgents.contains(intent.agentId)||
        !_allowedCapabilities.contains(intent.capability)){
      throw StateError('Hub intent escaped customer-safe workforce boundary');
    }
    final command=intent.toCommandContext();
    if(command['surface']!='hub'||
        command['authority_granted']!=false||
        command['requires_command_bus']!=true){
      throw StateError('Hub intent attempted to grant authority or bypass Command Bus');
    }
  }
}
