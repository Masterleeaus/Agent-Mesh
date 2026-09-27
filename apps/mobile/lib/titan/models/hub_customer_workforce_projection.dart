import 'workforce_context.dart';

/// Customer-safe projection of canonical workforce identity.
/// This never creates Hub-specific agents or grants authority.
class HubCustomerWorkforceProjection {
  final String agentId;
  final String label;
  final String team;
  final String customerCapability;
  const HubCustomerWorkforceProjection({
    required this.agentId,
    required this.label,
    required this.team,
    required this.customerCapability,
  });

  static HubCustomerWorkforceProjection fromCanonical(
    TitanWorkforceContext context, {
    required String customerCapability,
  }) {
    final agentId=context.agentId;
    if(agentId==null||agentId.isEmpty){
      throw StateError('Hub workforce projection requires canonical agent_id');
    }
    if(!_allowedCanonicalAgentIds.contains(agentId)){
      throw StateError('Canonical agent is not customer-projectable');
    }
    return HubCustomerWorkforceProjection(
      agentId:agentId,
      label:context.label,
      team:'Service team',
      customerCapability:customerCapability,
    );
  }

  static const _allowedCanonicalAgentIds=<String>{
    'TZAG-CX-CUSTOMER-EXPECTATION-MANAGEMENT',
    'TZAG-OPS-ACCESS-FAILURE-PREVENTION',
    'TZAG-CX-CALLBACK-PREVENTION',
  };
}
