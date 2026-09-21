import '../models/hub_customer_workforce_projection.dart';

class HubCustomerWorkforceProjectionContract {
  static void validate(List<HubCustomerWorkforceProjection> items){
    if(items.length!=3){
      throw StateError('Hub customer workforce requires exactly three home projections');
    }
    final ids=<String>{};
    for(final item in items){
      if(item.agentId.startsWith('hub.')||item.agentId.trim().isEmpty){
        throw StateError('Hub must reuse canonical workforce agent_id');
      }
      if(!ids.add(item.agentId)){
        throw StateError('Hub cannot clone a canonical workforce identity');
      }
      if(item.team!='Service team'){
        throw StateError('Internal workforce team must be shielded from Hub');
      }
      if(!const {
        'customer.manage','booking.manage','interaction.resolve',
      }.contains(item.customerCapability)){
        throw StateError('Hub exposes a non-customer capability');
      }
    }
  }
}
