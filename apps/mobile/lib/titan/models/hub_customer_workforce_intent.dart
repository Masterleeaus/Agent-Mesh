class HubCustomerWorkforceIntent {
  final String companyId;
  final String customerId;
  final String agentId;
  final String capability;
  final String intentType;
  final String? serviceId;
  final String requestId;
  const HubCustomerWorkforceIntent({
    required this.companyId,
    required this.customerId,
    required this.agentId,
    required this.capability,
    required this.intentType,
    required this.requestId,
    this.serviceId,
  });

  Map<String,dynamic> toCommandContext()=>{
    'company_id':companyId,
    'customer_id':customerId,
    'agent_id':agentId,
    'capability':capability,
    'intent_type':intentType,
    'request_id':requestId,
    if(serviceId!=null)'service_id':serviceId,
    'surface':'hub',
    'authority_granted':false,
    'requires_command_bus':true,
  };
}
