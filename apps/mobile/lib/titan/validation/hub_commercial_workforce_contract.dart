import '../models/hub_commercial_workforce_intent.dart';

class HubCommercialWorkforceContract {
  static void validate(HubCommercialWorkforceIntent intent){
    if(intent.companyId.trim().isEmpty||intent.customerId.trim().isEmpty){
      throw StateError('Hub commercial intent is not company/customer scoped');
    }
    if(intent.agentId!='TZAG-REV-MISSED-REVENUE-RECOVERY'){
      throw StateError('Hub must reuse canonical revenue/accounts agent');
    }
    if(!const {'quote.manage','payment.intent.prepare'}.contains(intent.capability)){
      throw StateError('Hub exposes non-customer commercial capability');
    }
    final ctx=intent.toCommandContext();
    if(ctx['surface']!='hub'||ctx['authority_granted']!=false||
       ctx['requires_command_bus']!=true||
       ctx['requires_server_revalidation']!=true){
      throw StateError('Hub commercial intent bypasses governance');
    }
  }
}
